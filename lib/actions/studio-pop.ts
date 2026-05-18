import type { Action } from '@/lib/types';

const action: Action = {
  id: 'studio_pop',
  name: 'Studio Pop',
  description: 'Transform a poorly lit or low-quality photo into a polished studio portrait with beauty lighting and sharp subject separation.',
  category: 'Enhancement',
  icon: '💡',
  pipeline: 'gpt_retouch',
  has_prompt: false,
  bg_prompt: 'Enhance this image to look like it was captured using a high-end large format camera with a premium ultra-sharp portrait lens and professional studio lighting. Preserve the original composition, pose, expression, clothing, and identity exactly. Improve overall image quality with realistic high-end optical detail, clean sharpness, refined texture rendering, and natural depth. Remove noise, compression artifacts, poor phone-camera processing, blur, and muddy textures while keeping the image believable and photographic. Apply soft diffused beauty lighting that flatters the subject with smooth, even illumination and gentle light falloff. Brighten the subject naturally without creating harsh shadows or blown highlights. Maintain dimensionality and realistic skin texture — avoid plastic skin or over-retouching. Enhance facial clarity, eyes, hair, fabrics, and fine details with subtle micro-contrast and premium lens rendering. Add natural depth separation and smooth large-format style background rendering without making the blur look artificial. Improve environmental colors and tonal depth with rich but controlled color grading. Make colors cleaner, deeper, and more cinematic while keeping saturation realistic and balanced. Preserve accurate skin tones and natural white balance. Final result should feel like a professionally lit luxury editorial photograph captured on an expensive medium or large format camera with exceptional optics and refined color science.',
};

export default action;
