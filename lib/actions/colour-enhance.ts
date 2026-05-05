import type { Action } from '@/lib/types';

const action: Action = {
  id: 'colour_enhance',
  name: 'Colour Enhancement',
  description: 'Boost vibrancy, balance tones, and apply professional colour grading.',
  category: 'Retouching',
  icon: '🎨',
  pipeline: 'gpt_retouch',
  has_prompt: false,
  bg_prompt: 'Enhance the colours in this photo: boost vibrancy and saturation, balance the tones, improve contrast and brightness, and apply professional colour grading. Keep the subject and background intact — only improve the overall colour quality.',
};

export default action;
