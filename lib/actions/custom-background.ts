import type { Action } from '@/lib/types';

const action: Action = {
  id: 'custom_background',
  name: 'Custom Background',
  description: 'Describe any background you want.',
  category: 'Background',
  icon: '✏️',
  pipeline: 'gpt_bg',
  has_prompt: true,
  prompt_label: 'Describe the new background:',
  bg_prompt: '',
};

export default action;
