import type { Pipeline } from '@/lib/types';

// Two-step pipeline: face restoration → crisp upscale
export const DEFAULT_MODEL_GFPGAN = 'flux-kontext-apps/restore-image';
export const DEFAULT_MODEL_UPSCALE = 'recraft-ai/recraft-crisp-upscale';

const pipeline: Pipeline = {
  id: 'portrait_retouch',
  steps: [
    {
      model: DEFAULT_MODEL_GFPGAN,
      buildInput: (ctx) => ({
        input_image: ctx.inputUrl,
      }),
      // Output is saved as intermediate_url; passed to step 2 via ctx.intermediateUrl.
    },
    {
      model: DEFAULT_MODEL_UPSCALE,
      buildInput: (ctx) => ({
        image: ctx.intermediateUrl ?? ctx.inputUrl,
      }),
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
