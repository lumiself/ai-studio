import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { verifyWebhookSignature, createPrediction, getModelOverrides } from '@/lib/replicate';
import { getPipeline, resolveModel } from '@/lib/pipelines';
import { downloadAndStore, resultFilename } from '@/lib/storage';
import { compositeImages } from '@/lib/composite';
import { uploadToStorage } from '@/lib/storage';

interface ReplicateWebhookBody {
  id: string;
  status: 'succeeded' | 'failed' | 'canceled';
  output: unknown;
  error?: string;
}

const WEBHOOK_BASE = process.env.NEXT_PUBLIC_APP_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify Replicate's signature to prevent spoofed webhook calls.
  const valid = await verifyWebhookSignature(rawBody, req.headers);
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

  const body: ReplicateWebhookBody = JSON.parse(rawBody);
  const db = createServiceSupabase();

  // Load the job row.
  const { data: job, error: fetchError } = await db
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    console.error('Webhook: job not found', jobId, fetchError);
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (body.status === 'failed' || body.status === 'canceled') {
    await db.from('jobs').update({
      status: 'failed',
      error: body.error ?? body.status,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    return NextResponse.json({ ok: true });
  }

  const pipeline = getPipeline(job.pipeline);
  if (!pipeline) {
    await db.from('jobs').update({ status: 'failed', error: 'Unknown pipeline' }).eq('id', jobId);
    return NextResponse.json({ error: 'Unknown pipeline' }, { status: 500 });
  }

  const currentStep = job.step as number;
  const HD_UPSCALE_MODEL = 'prunaai/p-image-upscale';
  const pipelineEndsWithUpscale = pipeline.steps[pipeline.steps.length - 1]?.model === HD_UPSCALE_MODEL;
  const needsHdStep = (job.high_res as boolean) && !pipelineEndsWithUpscale;
  // A "virtual" step index one beyond the pipeline definition — the appended HD upscale.
  const isVirtualHdStep = needsHdStep && currentStep === pipeline.steps.length;
  const isLastPipelineStep = currentStep === pipeline.steps.length - 1;
  const isFinalStep = isVirtualHdStep || (isLastPipelineStep && !needsHdStep);

  try {
    if (isFinalStep) {
      // ── Final step: save result and mark job succeeded ─────────────────
      let outputUrl: string;

      if (job.pipeline === 'replace_bg' && currentStep === 1 && !isVirtualHdStep) {
        // Step 1 output = background image URL; composite with foreground.
        const bgUrl = extractUrl(body.output);
        const fgUrl = job.intermediate_url as string;
        if (!fgUrl) throw new Error('Missing intermediate_url for compositing');

        const composited = await compositeImages(fgUrl, bgUrl);
        outputUrl = await uploadToStorage(composited, resultFilename(jobId, 'jpg'), 'results');
      } else {
        const rawUrl = extractUrl(body.output);
        const ext = rawUrl.endsWith('.png') ? 'png' : 'jpg';
        outputUrl = await downloadAndStore(rawUrl, resultFilename(jobId, ext), 'results');
      }

      await db.from('jobs').update({
        status: 'succeeded',
        output_url: outputUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', jobId);

    } else if (isLastPipelineStep && needsHdStep) {
      // ── Last pipeline step, but HD upscale still pending ──────────────
      let intermediateUrl: string;

      if (job.pipeline === 'replace_bg' && currentStep === 1) {
        // Composite first, then upscale the composited image.
        const bgUrl = extractUrl(body.output);
        const fgUrl = job.intermediate_url as string;
        if (!fgUrl) throw new Error('Missing intermediate_url for compositing');
        const composited = await compositeImages(fgUrl, bgUrl);
        intermediateUrl = await uploadToStorage(composited, `${jobId}_step${currentStep}.jpg`, 'uploads');
      } else {
        const rawUrl = extractUrl(body.output);
        const ext = rawUrl.endsWith('.png') ? 'png' : 'jpg';
        intermediateUrl = await downloadAndStore(rawUrl, `${jobId}_step${currentStep}.${ext}`, 'uploads');
      }

      const webhookUrl = `${WEBHOOK_BASE}/api/webhook/replicate`;
      const newPredictionId = await createPrediction({
        model: HD_UPSCALE_MODEL,
        input: { image: intermediateUrl, upscale_mode: 'target', target: 8 },
        webhookUrl,
        jobId,
      });

      await db.from('jobs').update({
        step: pipeline.steps.length, // virtual HD step index
        prediction_id: newPredictionId,
        intermediate_url: intermediateUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', jobId);

    } else {
      // ── Intermediate step: save output, start next step ───────────────
      const intermediateUrl = extractUrl(body.output);

      // Save foreground PNG as intermediate.
      const storedIntermediate = await downloadAndStore(
        intermediateUrl,
        `${jobId}_step${currentStep}.png`,
        'uploads',
      );

      const nextStep = currentStep + 1;
      const overrides = await getModelOverrides();
      const nextModel = resolveModel(pipeline, nextStep, overrides);
      if (!nextModel) throw new Error(`No model configured for step ${nextStep}`);

      const nextStepDef = pipeline.steps[nextStep];
      if (!nextStepDef?.buildInput) throw new Error(`Step ${nextStep} has no buildInput`);

      const ctx = {
        inputUrl: job.input_url as string,
        bgPrompt: job.bg_prompt as string | undefined,
        scale: job.scale as number | undefined,
        faceEnhance: job.face_enhance as boolean | undefined,
        intermediateUrl: storedIntermediate,
      };

      const nextInput = nextStepDef.buildInput(ctx);
      const webhookUrl = `${WEBHOOK_BASE}/api/webhook/replicate`;
      const newPredictionId = await createPrediction({
        model: nextModel,
        input: nextInput,
        webhookUrl,
        jobId,
      });

      await db.from('jobs').update({
        step: nextStep,
        prediction_id: newPredictionId,
        intermediate_url: storedIntermediate,
        updated_at: new Date().toISOString(),
      }).eq('id', jobId);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    await db.from('jobs').update({
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  return NextResponse.json({ ok: true });
}

function extractUrl(output: unknown): string {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0];
  throw new Error(`Unexpected Replicate output format: ${JSON.stringify(output)}`);
}
