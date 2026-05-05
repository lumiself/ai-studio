import type { Action } from '@/lib/types';

const action: Action = {
  id: 'skin_refine',
  name: 'Skin Refinement',
  description: 'Smooth skin texture, reduce blemishes, and even out skin tone naturally.',
  category: 'Retouching',
  icon: '✨',
  pipeline: 'gpt_retouch',
  has_prompt: false,
  bg_prompt: 'Retouch the skin in this portrait: smooth skin texture, reduce blemishes and imperfections, even out skin tone, and soften fine lines. Keep the result natural and realistic — do not over-smooth or make the skin look plastic. Keep everything else in the image unchanged.',
};

export default action;
