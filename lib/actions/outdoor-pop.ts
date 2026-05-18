import type { Action } from '@/lib/types';

const action: Action = {
  id: 'outdoor_pop',
  name: 'Outdoor Pop',
  description: 'Elevate an outdoor photo taken in poor light into a vivid, sharp shot with natural depth and professional-grade exposure.',
  category: 'Enhancement',
  icon: '🌤️',
  pipeline: 'gpt_retouch',
  has_prompt: false,
  bg_prompt: 'Transform this photo to look like it was shot outdoors with a high-end camera and a skilled photographer. Apply natural directional lighting as if from the sun or open sky: lift the shadows on the subject\'s face to reveal detail, add gentle warmth and golden-hour quality to the light, and ensure the subject is sharply in focus while the background has natural environmental depth and slight blur from a wide aperture. Enhance sky and environment tones to look vivid and rich without being overdone. Improve overall exposure, dynamic range, and colour to match a professional outdoor portrait. Do not alter facial features, clothing, or the subject\'s appearance — only improve the light quality, depth, and technical finish of the photo.',
};

export default action;
