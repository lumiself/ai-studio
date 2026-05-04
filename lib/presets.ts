import type { Preset } from './types';

export const PRESETS: Preset[] = [
  // ── Birthday ──────────────────────────────────────────────────────────
  {
    id: 'birthday_green_silver',
    name: 'Green & Silver',
    description: 'Elegant green and silver balloon arch setup with number balloons.',
    category: 'Birthday',
    pipeline: 'gpt_bg',
    bg_prompt: 'Using the second image as the exact visual reference for the background scene, replace the background and seat/chair in the first image to match: dark emerald green studio backdrop, mixed chrome green, black, and silver balloon garland arch, large silver foil number {age} balloons prominently displayed, small birthday cake on a white side table, velvet chaise lounge as the seat, dramatic studio lighting. Keep the person, clothing, skin, hair, and pose completely unchanged.',
    inputs: [{ type: 'number', id: 'age', label: 'Age', required: true, min: 1, max: 120, placeholder: 'e.g. 18' }],
  },
  {
    id: 'birthday_white_gold',
    name: 'White & Gold',
    description: 'Luxurious white and gold birthday setup with confetti.',
    category: 'Birthday',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a luxurious birthday setup: pure white studio backdrop, gold and white balloon arch, large gold number {age} foil balloons, scattered gold confetti, champagne draping, elegant warm ambient lighting, photorealistic. Keep the subject exactly as is.',
    inputs: [
      { type: 'number', id: 'age',  label: 'Age',             required: true,  min: 1, max: 120, placeholder: 'e.g. 21' },
      { type: 'text',   id: 'name', label: 'Name (optional)',  required: false, placeholder: 'e.g. Jordan' },
    ],
  },
  {
    id: 'birthday_pink_princess',
    name: 'Pink Princess',
    description: 'Dreamy blush pink and rose gold princess birthday theme.',
    category: 'Birthday',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a dreamy birthday setup: blush pink and rose gold balloon cluster, large pink number {age} balloon, floral arch with pastel roses and peonies, soft pink backdrop with fairy lights, warm flattering studio lighting, photorealistic. Keep the subject exactly as is.',
    inputs: [
      { type: 'number', id: 'age',  label: 'Age',             required: true,  min: 1, max: 120, placeholder: 'e.g. 16' },
      { type: 'text',   id: 'name', label: 'Name (optional)',  required: false, placeholder: 'e.g. Aaliyah' },
    ],
  },
  {
    id: 'birthday_red_black',
    name: 'Red & Black',
    description: 'Bold red and black birthday setup, dramatic and luxe.',
    category: 'Birthday',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a dramatic birthday setup: black velvet backdrop, bold red and black balloon arch, large chrome number {age} balloons, red roses on a pedestal, moody cinematic lighting with deep shadows, photorealistic. Keep the subject exactly as is.',
    inputs: [
      { type: 'number', id: 'age',  label: 'Age',             required: true,  min: 1, max: 120, placeholder: 'e.g. 30' },
      { type: 'text',   id: 'name', label: 'Name (optional)',  required: false, placeholder: 'e.g. Darius' },
    ],
  },
  {
    id: 'birthday_black_balloons',
    name: 'Black Balloons',
    description: 'Stand between large black marquee light-up numbers with black and rose gold balloons.',
    category: 'Birthday',
    pipeline: 'gpt_bg',
    bg_prompt: 'Using the second image as the exact visual reference for the background, replace only the background in the first image to match: a clean light grey/white studio backdrop, two large black marquee light-up number signs spelling {age} positioned on either side of the subject so the subject stands between them, clusters of black and rose gold metallic balloons on both sides. Keep the person, clothing, skin, hair, and pose completely unchanged.',
    inputs: [{ type: 'number', id: 'age', label: 'Age', required: true, min: 1, max: 120, placeholder: 'e.g. 25' }],
  },
  {
    id: 'birthday_pink_clean',
    name: 'Pink Clean',
    description: 'Deep pink rose flower wall with balloon arch and loose pink balloons.',
    category: 'Birthday',
    pipeline: 'gpt_bg',
    bg_prompt: 'Using the second image as the exact visual reference for the background, replace only the background in the first image to match: a full lush deep pink/fuchsia rose flower wall covering the entire backdrop, a pink and white balloon garland arch framing the top and sides, loose pink balloons scattered on a clean white floor. Keep the person, clothing, skin, hair, and pose completely unchanged.',
    inputs: [],
  },
  // ── Portrait ──────────────────────────────────────────────────────────
  {
    id: 'portrait_pink_studio',
    name: 'Pink Studio',
    description: 'Seated pose on a white cube against a deep pink backdrop with a glowing halo.',
    category: 'Portrait',
    pipeline: 'gpt_bg',
    bg_prompt: 'Using the second image as the exact visual reference for the background scene, replace the background and seat/chair in the first image to match: deep dusty rose/mauve studio backdrop, large soft circular spotlight halo glowing on the backdrop behind the subject, subject seated on a clean white cube/box pedestal. Keep the person, clothing, skin, hair, and pose completely unchanged.',
    inputs: [],
  },
  {
    id: 'portrait_studio_white',
    name: 'Studio White',
    description: 'Clean, professional white studio portrait backdrop.',
    category: 'Portrait',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a clean professional white studio backdrop, soft diffused key and fill lighting, subtle ground shadow, high-key portrait photography. Keep the subject exactly as is.',
    inputs: [],
  },
  {
    id: 'portrait_gradient_dark',
    name: 'Dark Gradient',
    description: 'Dramatic dark charcoal gradient studio backdrop.',
    category: 'Portrait',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a dramatic dark charcoal grey gradient studio backdrop, Rembrandt-style directional lighting, subtle vignette, professional portrait photography. Keep the subject exactly as is.',
    inputs: [],
  },
  {
    id: 'portrait_outdoor_bokeh',
    name: 'Outdoor Bokeh',
    description: 'Lush outdoor setting with golden hour bokeh.',
    category: 'Portrait',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a lush outdoor garden at golden hour, soft creamy bokeh, shallow depth of field, warm sunlight, blurred green foliage and flowers, professional outdoor portrait photography. Keep the subject exactly as is.',
    inputs: [],
  },
  {
    id: 'portrait_city_night',
    name: 'City Night',
    description: 'Urban nightscape with blurred bokeh city lights.',
    category: 'Portrait',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a vibrant urban night cityscape, blurred bokeh street lights and neon signs, cinematic atmosphere, depth of field, professional night portrait photography. Keep the subject exactly as is.',
    inputs: [],
  },
  // ── Baby ──────────────────────────────────────────────────────────────
  {
    id: 'baby_soft_pink',
    name: 'Soft Pink',
    description: 'Soft blush pink nursery-themed baby backdrop.',
    category: 'Baby',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a soft pink nursery-themed setting: blush pink muslin backdrop, delicate floral props, white knit texture, pastel pink balloon cluster, soft diffused natural light, dreamy atmosphere, newborn photography style. Keep the subject exactly as is.',
    inputs: [
      { type: 'text',   id: 'name',       label: "Baby's Name (optional)",   required: false, placeholder: 'e.g. Aria' },
      { type: 'number', id: 'age_months', label: 'Age in months (optional)', required: false, min: 0, max: 36, placeholder: 'e.g. 6' },
    ],
  },
  {
    id: 'baby_blue_dream',
    name: 'Blue Dream',
    description: 'Dreamy powder blue cloud backdrop for baby boys.',
    category: 'Baby',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a dreamy baby blue cloud setting: powder blue muslin backdrop, white fluffy cloud props, pale blue and white balloon clusters, celestial nursery aesthetic, gentle diffused soft lighting, newborn photography. Keep the subject exactly as is.',
    inputs: [
      { type: 'text',   id: 'name',       label: "Baby's Name (optional)",   required: false, placeholder: 'e.g. Noah' },
      { type: 'number', id: 'age_months', label: 'Age in months (optional)', required: false, min: 0, max: 36, placeholder: 'e.g. 3' },
    ],
  },
  {
    id: 'baby_neutral_boho',
    name: 'Neutral Boho',
    description: 'Warm neutral bohemian baby backdrop with natural textures.',
    category: 'Baby',
    pipeline: 'gpt_bg',
    bg_prompt: 'Replace the background with a warm neutral boho baby setting: cream and tan textured backdrop, natural dried pampas grass, wicker basket accent, macramé hanging, warm golden natural light, earthy and organic aesthetic, lifestyle baby photography. Keep the subject exactly as is.',
    inputs: [
      { type: 'text',   id: 'name',       label: "Baby's Name (optional)",   required: false, placeholder: 'e.g. Sage' },
      { type: 'number', id: 'age_months', label: 'Age in months (optional)', required: false, min: 0, max: 36, placeholder: 'e.g. 9' },
    ],
  },
];

export const PRESET_CATEGORIES = [...new Set(PRESETS.map(p => p.category))];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id);
}
