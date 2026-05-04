import type { Pipeline } from '@/lib/types';

// ── Register pipelines here ───────────────────────────────────────────────
// To add a new pipeline: create its file in this folder, then add one import
// line and one entry in the PIPELINES array below. That's it.
import removeBg        from './remove-bg';
import replaceBg       from './replace-bg';
import upscale         from './upscale';
import gfpgan          from './gfpgan';
import portraitRetouch from './portrait-retouch';
import gptBg           from './gpt-bg';

export const PIPELINES: Pipeline[] = [
  removeBg,
  replaceBg,
  upscale,
  gfpgan,
  portraitRetouch,
  gptBg,
];

export function getPipeline(id: string): Pipeline | undefined {
  return PIPELINES.find(p => p.id === id);
}

// Returns the Replicate model ID for a pipeline step, allowing DB overrides.
// modelOverrides shape: { 'model_remove_bg': 'owner/model:version', ... }
export function resolveModel(
  pipeline: Pipeline,
  stepIndex: number,
  modelOverrides: Record<string, string> = {},
): string | null {
  const step = pipeline.steps[stepIndex];
  if (!step) return null;
  // Override key convention: 'model_{pipeline_id}_step{n}' or just 'model_{pipeline_id}' for single-step
  const key = pipeline.steps.length === 1
    ? `model_${pipeline.id}`
    : `model_${pipeline.id}_step${stepIndex}`;
  return modelOverrides[key] ?? step.model;
}
