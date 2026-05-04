import type { Action } from '@/lib/types';

// ── Register actions here ─────────────────────────────────────────────────
// To add a new action: create its file in this folder, then add one import
// line and one entry in the ACTIONS array below. That's it.
import removeBackground from './remove-background';
import studioBackground from './studio-background';
import natureBackground from './nature-background';
import officeBackground from './office-background';
import cityBackground   from './city-background';
import customBackground from './custom-background';
import faceRestoration  from './face-restoration';
import portraitRetouch  from './portrait-retouch';
import upscale2x        from './upscale-2x';
import upscale4x        from './upscale-4x';
import hdEnhance        from './hd-enhance';

export const ACTIONS: Action[] = [
  removeBackground,
  studioBackground,
  natureBackground,
  officeBackground,
  cityBackground,
  customBackground,
  faceRestoration,
  portraitRetouch,
  upscale2x,
  upscale4x,
  hdEnhance,
];

export const ACTION_CATEGORIES = [...new Set(ACTIONS.map(a => a.category))];

export function getAction(id: string): Action | undefined {
  return ACTIONS.find(a => a.id === id);
}
