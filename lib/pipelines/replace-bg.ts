import type { Pipeline } from '@/lib/types';

// Step 1: remove background
export const DEFAULT_MODEL_REMOVE = 'bria/remove-background';
// Step 2: generate new background from prompt (SDXL)
export const DEFAULT_MODEL_BG_GEN = 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e0d392b4f4397dbd4a1eedfb0';

// Two Replicate steps; compositing happens inside step 2's processOutput (in the webhook handler
// via lib/composite.ts), using the foreground stored in job.intermediate_url and the
// background image produced by SDXL.
const pipeline: Pipeline = {
  id: 'replace_bg',
  steps: [
    {
      model: DEFAULT_MODEL_REMOVE,
      buildInput: (ctx) => ({ image: ctx.inputUrl }),
      // Output (foreground PNG) is saved as intermediate_url by the webhook handler.
      // processOutput is intentionally absent — webhook handler does the save.
    },
    {
      model: DEFAULT_MODEL_BG_GEN,
      buildInput: (ctx) => ({
        prompt: ctx.bgPrompt ?? 'a clean professional studio background',
        negative_prompt: 'people, text, watermark',
        width: 1024,
        height: 1024,
        num_inference_steps: 30,
      }),
      // output = background image URL; ctx.intermediateUrl = foreground PNG URL
      // The webhook handler calls composite() and stores the final result.
      processOutput: async () => {
        // Compositing is performed by the webhook handler using lib/composite.ts.
        // This function is a no-op marker; the webhook reads the model and routes accordingly.
        throw new Error('replace_bg step 2 processOutput must be called via the webhook handler with composite support');
      },
    },
  ],
};

export default pipeline;
