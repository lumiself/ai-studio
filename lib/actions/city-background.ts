import type { Action } from '@/lib/types';

const action: Action = {
  id: 'city_background',
  name: 'City Background',
  description: 'Urban skyline backdrop with bokeh city lights.',
  category: 'Background',
  icon: '🌆',
  pipeline: 'gpt_bg',
  has_prompt: false,
  bg_prompt: 'Replace the background with an urban city skyline at dusk, bokeh street lights, modern architecture, cinematic lighting, photorealistic. Keep the subject exactly as is.',
};

export default action;
