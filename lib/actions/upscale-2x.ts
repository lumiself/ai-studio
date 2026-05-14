import type { Action } from '@/lib/types';

const action: Action = {
  id: 'upscale_2x',
  name: 'Upscale 2×',
  description: 'Doubles image resolution with AI super-resolution.',
  category: 'Enhancement',
  icon: '🔍',
  pipeline: 'upscale',
  has_prompt: false,
  scale: 2,
  face_enhance: false,
};

export default action;
