import type { Pipeline } from '@/lib/types';

// Default model can be overridden via admin settings → DB key 'model_upscale'
export const DEFAULT_MODEL = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b';

const pipeline: Pipeline = {
  id: 'upscale',
  steps: [
    {
      model: DEFAULT_MODEL,
      buildInput: (ctx) => ({
        image: ctx.inputUrl,
        scale: ctx.scale ?? 2,
        face_enhance: ctx.faceEnhance ?? false,
      }),
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
