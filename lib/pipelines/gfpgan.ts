import type { Pipeline } from '@/lib/types';

// Default model can be overridden via admin settings → DB key 'model_gfpgan'
export const DEFAULT_MODEL = 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355f829a539ad9f567c337d62464d05d';

const pipeline: Pipeline = {
  id: 'gfpgan',
  steps: [
    {
      model: DEFAULT_MODEL,
      buildInput: (ctx) => ({
        img: ctx.inputUrl,
        scale: ctx.scale ?? 2,
        version: 'v1.4',
      }),
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
