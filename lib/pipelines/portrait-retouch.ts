import type { Pipeline } from '@/lib/types';

// Two-step pipeline: GFPGAN face restoration → Real-ESRGAN 2× upscale
export const DEFAULT_MODEL_GFPGAN = 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355f829a539ad9f567c337d62464d05d';
export const DEFAULT_MODEL_UPSCALE = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b';

const pipeline: Pipeline = {
  id: 'portrait_retouch',
  steps: [
    {
      model: DEFAULT_MODEL_GFPGAN,
      buildInput: (ctx) => ({
        img: ctx.inputUrl,
        scale: 2,
        version: 'v1.4',
      }),
      // Output is saved as intermediate_url; passed to step 2 via ctx.intermediateUrl.
    },
    {
      model: DEFAULT_MODEL_UPSCALE,
      buildInput: (ctx) => ({
        image: ctx.intermediateUrl ?? ctx.inputUrl,
        scale: 2,
        face_enhance: false,
      }),
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
