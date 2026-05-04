import type { Pipeline } from '@/lib/types';

// Default model can be overridden via admin settings → DB key 'model_upscale'
export const DEFAULT_MODEL = 'recraft-ai/recraft-crisp-upscale';

const pipeline: Pipeline = {
  id: 'upscale',
  steps: [
    {
      model: DEFAULT_MODEL,
      buildInput: (ctx) => ({
        image: ctx.inputUrl,
      }),
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
