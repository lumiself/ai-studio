import type { Action } from '@/lib/types';

const action: Action = {
  id: 'office_background',
  name: 'Office Background',
  description: 'Places the subject in a modern professional office environment.',
  category: 'Background',
  icon: '🏢',
  pipeline: 'gpt_bg',
  has_prompt: false,
  bg_prompt: 'Replace the background with a modern professional office interior, large windows, blurred minimalist workspace, natural lighting, photorealistic. Keep the subject exactly as is.',
};

export default action;
