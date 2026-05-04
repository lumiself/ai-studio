import type { Pipeline } from '@/lib/types';

// Default model can be overridden via admin settings → DB key 'model_remove_bg'
export const DEFAULT_MODEL = 'lucataco/remove-bg';

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
