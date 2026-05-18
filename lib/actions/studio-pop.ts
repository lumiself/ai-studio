import type { Action } from '@/lib/types';

const action: Action = {
  id: 'studio_pop',
  name: 'Studio Pop',
  description: 'Transform a poorly lit or low-quality photo into a polished studio portrait with beauty lighting and sharp subject separation.',
  category: 'Enhancement',
  icon: '💡',
  pipeline: 'gpt_retouch',
  has_prompt: false,
  bg_prompt: 'Transform this photo to look like it was shot in a professional studio with high-end camera gear. Apply beauty lighting: add a soft key light from slightly above and to one side, a subtle fill light to open the shadows, and a rim or hair light to separate the subject from the background. Make the background dark, clean, and completely out of focus to give strong subject separation. Sharpen the subject with natural clarity and presence. Improve overall exposure and contrast so the image looks polished and intentional. Do not alter facial features, clothing, or the subject\'s appearance — only improve the lighting quality, depth, and technical finish of the photo.',
};

export default action;
