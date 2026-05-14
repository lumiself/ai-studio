import type { Pipeline } from '@/lib/types';

// Default model can be overridden via admin settings → DB key 'model_upscale'
export const DEFAULT_MODEL = 'prunaai/p-image-upscale';

const pipeline: Pipeline = {
  id: 'upscale',
  steps: [
    {
      model: DEFAULT_MODEL,
      buildInput: (ctx) => ({
        image: ctx.inputUrl,
        upscale_mode: 'factor',
        factor: ctx.scale ?? 2,
      }),
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
