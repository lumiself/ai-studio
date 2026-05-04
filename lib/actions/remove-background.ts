import type { Action } from '@/lib/types';

const action: Action = {
  id: 'remove_background',
  name: 'Remove Background',
  description: 'Cleanly removes the background, leaving a transparent PNG.',
  category: 'Background',
  icon: '✂',
  pipeline: 'remove_bg',
  has_prompt: false,
};

export default action;
