import type { Action } from '@/lib/types';

const action: Action = {
  id: 'hd_enhance',
  name: 'HD Enhancement',
  description: 'Maximum quality: 4× upscale with integrated face enhancement.',
  category: 'Enhancement',
  icon: '🏆',
  pipeline: 'upscale',
  has_prompt: false,
  scale: 4,
  face_enhance: true,
};

export default action;
