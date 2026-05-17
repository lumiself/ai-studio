export type ImageStatus = 'queued' | 'processing' | 'done' | 'failed';

// ── Pipeline system ────────────────────────────────────────────────────────

export interface StepContext {
  inputUrl: string;
  bgPrompt?: string;
  scale?: number;
  faceEnhance?: boolean;
  intermediateUrl?: string;
  lessStrict?: boolean;
}

export interface PipelineStep {
  model: string | null;
  alternativeModel?: string;
  buildInput?: (ctx: StepContext) => Record<string, unknown>;
  // Returns the URL to use as input for the next step, or the final output URL.
  processOutput?: (output: unknown, ctx: StepContext) => Promise<string>;
}

export interface Pipeline {
  id: string;
  steps: PipelineStep[];
}
export type ResultFilter = 'all' | 'done' | 'processing' | 'failed';
export type EditorMode = 'actions' | 'presets';

export interface PresetInput {
  type: 'text' | 'number';
  id: string;
  label: string;
  required: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  pipeline: string;
  bg_prompt: string;
  inputs: PresetInput[];
}

export interface Action {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  pipeline: string;
  has_prompt: boolean;
  prompt_label?: string;
  bg_prompt?: string;
  scale?: number;
  face_enhance?: boolean;
}

export interface QueuedImage {
  id: string;
  file?: File;
  inputUrl?: string;
  previewUrl: string;
  name: string;
  status: ImageStatus;
  selected: boolean;
  jobId?: string;
  outputUrl?: string;
  error?: string;
}

export interface ResultItem {
  id: string;
  imageId: string;
  imageName: string;
  inputUrl: string;
  outputUrl: string;
  selected: boolean;
}

export interface LibraryImage {
  id: string;
  url: string;
  thumbUrl?: string;
  name: string;
}

export interface BatchStats {
  total: number;
  done: number;
  processing: number;
  failed: number;
}
