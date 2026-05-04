import type { Action } from '@/lib/types';

const action: Action = {
  id: 'portrait_retouch',
  name: 'Portrait Retouch',
  description: 'Full portrait enhancement: face restoration followed by 2× upscaling.',
  category: 'Retouching',
  icon: '⭐',
  pipeline: 'portrait_retouch',
  has_prompt: false,
};

export default action;
