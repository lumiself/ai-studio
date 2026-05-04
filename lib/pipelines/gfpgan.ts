import type { Pipeline } from '@/lib/types';

// Default model can be overridden via admin settings → DB key 'model_gfpgan'
export const DEFAULT_MODEL = 'flux-kontext-apps/restore-image';

const pipeline: Pipeline = {
  id: 'gfpgan',
  steps: [
    {
      model: DEFAULT_MODEL,
      buildInput: (ctx) => ({
        input_image: ctx.inputUrl,
      }),
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
