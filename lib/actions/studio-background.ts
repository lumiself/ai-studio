import type { Action } from '@/lib/types';

const action: Action = {
  id: 'studio_background',
  name: 'Studio Background',
  description: 'Replaces background with a clean, soft white studio backdrop.',
  category: 'Background',
  icon: '⬜',
  pipeline: 'gpt_bg',
  has_prompt: false,
  bg_prompt: 'Replace the background with a clean white studio backdrop, soft gradient lighting, subtle ground shadow. Keep the subject exactly as is.',
};

export default action;
