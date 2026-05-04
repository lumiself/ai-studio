import type { Action } from '@/lib/types';

const action: Action = {
  id: 'upscale_4x',
  name: 'Upscale 4×',
  description: 'Quadruples image resolution using Real-ESRGAN super-resolution.',
  category: 'Enhancement',
  icon: '🔎',
  pipeline: 'upscale',
  has_prompt: false,
  scale: 4,
  face_enhance: false,
};

export default action;
