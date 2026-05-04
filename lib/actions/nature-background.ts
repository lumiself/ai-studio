import type { Action } from '@/lib/types';

const action: Action = {
  id: 'nature_background',
  name: 'Nature Background',
  description: 'Places the subject in a lush, golden-hour outdoor setting.',
  category: 'Background',
  icon: '🌿',
  pipeline: 'gpt_bg',
  has_prompt: false,
  bg_prompt: 'Replace the background with a lush outdoor landscape at golden hour, shallow depth of field bokeh, 8k photorealistic. Keep the subject exactly as is.',
};

export default action;
