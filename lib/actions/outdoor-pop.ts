import type { Action } from '@/lib/types';

const action: Action = {
  id: 'outdoor_pop',
  name: 'Outdoor Pop',
  description: 'Elevate an outdoor photo taken in poor light into a vivid, sharp shot with natural depth and professional-grade exposure.',
  category: 'Enhancement',
  icon: '🌤️',
  pipeline: 'gpt_retouch',
  has_prompt: false,
  bg_prompt: 'Transform this photo to look like it was shot outdoors on a Hasselblad X2D or Leica SL2 with an 85mm f/1.4 lens. Apply natural directional lighting as if from golden-hour sun or open shade with a reflector: lift the shadows on the subject\'s face to reveal detail, add gentle warmth and directional quality to the light, and render the subject with the sharpness and tonal richness of a large-format sensor. Enhance sky and environment tones to look vivid and rich without being overdone. Improve overall exposure, dynamic range, and colour to match a professional outdoor portrait shot with premium glass. Do not alter facial features, clothing, or the subject\'s appearance — only improve the light quality and technical finish of the photo.',
};

export default action;
