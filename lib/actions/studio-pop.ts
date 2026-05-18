import type { Action } from '@/lib/types';

const action: Action = {
  id: 'studio_pop',
  name: 'Studio Pop',
  description: 'Transform a poorly lit or low-quality photo into a polished studio portrait with beauty lighting and sharp subject separation.',
  category: 'Enhancement',
  icon: '💡',
  pipeline: 'gpt_retouch',
  has_prompt: false,
  bg_prompt: 'Transform this photo to look like it was shot in a professional studio with high-end camera gear. Apply beauty lighting: add a soft key light from slightly above and to one side, a subtle fill light to open the shadows, and a rim or hair light to naturally separate the subject from the background. Sharpen the subject with natural clarity and presence. Enhance the background — clean up noise, improve its exposure and colour so it looks intentional and well-lit rather than accidental. Improve overall contrast and tonal balance so the entire image looks polished. Do not replace or recolour the background. Do not alter facial features, clothing, or the subject\'s appearance — only improve the lighting quality and technical finish of the photo.',
};

export default action;
