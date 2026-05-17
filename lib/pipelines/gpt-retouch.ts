import type { Pipeline } from '@/lib/types';

const pipeline: Pipeline = {
  id: 'gpt_retouch',
  steps: [
    {
      model: 'openai/gpt-image-2',
      alternativeModel: 'black-forest-labs/flux-kontext-pro',
      buildInput: (ctx) => {
        if (ctx.lessStrict) {
          return {
            prompt: ctx.bgPrompt ?? 'Retouch and enhance this photo while keeping it natural.',
            input_image: ctx.inputUrl,
            aspect_ratio: '2:3',
            output_format: 'png',
          };
        }
        return {
          prompt: ctx.bgPrompt ?? 'Retouch and enhance this photo while keeping it natural.',
          input_images: [ctx.inputUrl],
          quality: 'medium',
          output_format: 'png',
          number_of_images: 1,
          background: 'opaque',
          moderation: 'low',
          aspect_ratio: '2:3',
        };
      },
      processOutput: async (output) => output as string,
    },
  ],
};

export default pipeline;
