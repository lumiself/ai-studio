import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { deductTokens, getBalance } from '@/lib/tokens';
import { createPrediction, getModelOverrides } from '@/lib/replicate';
import { getPipeline, resolveModel } from '@/lib/pipelines';
import { getAction } from '@/lib/actions';
import { getPreset } from '@/lib/presets';

const TOKEN_COST = 1; // tokens per image processed
const WEBHOOK_BASE = process.env.NEXT_PUBLIC_APP_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    jobId: string;
    inputUrl: string;
    actionId: string;
    bgPrompt?: string;
    presetInputValues?: Record<string, string>;
  };

  const { jobId, inputUrl, actionId, bgPrompt, presetInputValues } = body;
  if (!jobId || !inputUrl || !actionId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Resolve to an action or a preset (static first, then custom from DB).
  const action = getAction(actionId);
  let preset = action ? null : getPreset(actionId);
  if (!action && !preset) {
    const db = createServiceSupabase();
    const { data: row } = await db.from('custom_presets').select('*').eq('id', actionId).single();
    if (row) {
      preset = {
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        category: row.category,
        thumbnail: row.thumbnail_url ?? undefined,
        pipeline: row.pipeline ?? 'gpt_bg',
        bg_prompt: row.bg_prompt ?? '',
        inputs: row.inputs ?? [],
      };
    }
  }
  if (!action && !preset) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const pipelineId = action ? action.pipeline : preset!.pipeline;
  const pipeline = getPipeline(pipelineId);
  if (!pipeline) return NextResponse.json({ error: 'Unknown pipeline' }, { status: 400 });

  // Check and deduct tokens before touching Replicate.
  const balance = await getBalance(user.id);
  if (!balance || balance.balance < TOKEN_COST) {
    return NextResponse.json({ error: 'Insufficient token balance' }, { status: 402 });
  }

  const deducted = await deductTokens(user.id, TOKEN_COST);
  if (!deducted) return NextResponse.json({ error: 'Insufficient token balance' }, { status: 402 });

  // Resolve which model to use for step 0 (accounting for admin overrides).
  const overrides = await getModelOverrides();
  const model = resolveModel(pipeline, 0, overrides);
  if (!model) return NextResponse.json({ error: 'Pipeline model not configured' }, { status: 500 });

  // Resolve the bg_prompt — substitute {key} placeholders for presets.
  let resolvedBgPrompt: string | undefined;
  if (preset) {
    resolvedBgPrompt = preset.bg_prompt.replace(/\{(\w+)\}/g, (_, key) =>
      presetInputValues?.[key] ?? ''
    );
  } else {
    resolvedBgPrompt = bgPrompt ?? action!.bg_prompt;
  }

  // Build step 0 input context.
  const ctx = {
    inputUrl,
    bgPrompt: resolvedBgPrompt,
    scale: action?.scale,
    faceEnhance: action?.face_enhance,
  };

  const stepFn = pipeline.steps[0]?.buildInput;
  if (!stepFn) return NextResponse.json({ error: 'Pipeline step has no buildInput' }, { status: 500 });

  const replicateInput = stepFn(ctx);

  const webhookUrl = `${WEBHOOK_BASE}/api/webhook/replicate`;
  let predictionId: string;
  try {
    predictionId = await createPrediction({ model, input: replicateInput, webhookUrl, jobId });
  } catch (err) {
    console.error('Replicate createPrediction failed:', err);
    return NextResponse.json({ error: 'Failed to start prediction' }, { status: 500 });
  }

  // Insert job row into Supabase.
  const db = createServiceSupabase();
  const { error: dbError } = await db.from('jobs').insert({
    id: jobId,
    user_id: user.id,
    pipeline: pipeline.id,
    action_id: actionId,
    status: 'processing',
    step: 0,
    prediction_id: predictionId,
    input_url: inputUrl,
    bg_prompt: resolvedBgPrompt ?? null,
    scale: action?.scale ?? null,
    face_enhance: action?.face_enhance ?? null,
  });

  if (dbError) {
    console.error('Failed to insert job:', dbError);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }

  return NextResponse.json({ jobId, predictionId });
}
