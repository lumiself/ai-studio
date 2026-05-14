import type { Action } from '@/lib/types';

const action: Action = {
  id: 'colour_enhance',
  name: 'Colour Enhancement',
  description: 'Boost vibrancy, balance tones, and apply professional colour grading.',
  category: 'Retouching',
  icon: '🎨',
  pipeline: 'gpt_retouch',
  has_prompt: false,
  bg_prompt: 'Enhance the colours in this portrait photo with professional colour grading: lift the shadows and open up the midtones to brighten the subject naturally, add gentle clarity and presence without crushing the blacks, boost vibrance while protecting warm skin tones from oversaturation, balance white balance for flattering and neutral skin, and ensure the highlights stay clean and luminous. Keep all facial features, clothing, and background intact — only improve the colour quality and light.',
};

export default action;
