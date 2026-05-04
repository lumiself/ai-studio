import type { Pipeline } from '@/lib/types';

// Default model can be overridden via admin settings → DB key 'model_remove_bg'
export const DEFAULT_MODEL = 'lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285d65c14638e851f45be1cc22e';

const pipeline: Pipeline = {
  id: 'remove_bg',
  steps: [
    {
      model: DEFAULT_MODEL,
      buildInput: (ctx) => ({ image: ctx.inputUrl }),
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
