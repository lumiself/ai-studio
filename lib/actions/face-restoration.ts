import type { Action } from '@/lib/types';

const action: Action = {
  id: 'face_restoration',
  name: 'Face Restoration',
  description: 'Restores damaged, blurry, or low-quality facial detail with GFPGAN.',
  category: 'Retouching',
  icon: '👤',
  pipeline: 'gfpgan',
  has_prompt: false,
  scale: 2,
};

export default action;
