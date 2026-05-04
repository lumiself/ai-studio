'use client';
import { useReducer, useCallback, useState, useEffect, useRef } from 'react';
import UploadPanel from '@/components/editor/UploadPanel';
import TemplatesPanel from '@/components/editor/TemplatesPanel';
import ResultsPanel from '@/components/editor/ResultsPanel';
import type { QueuedImage, ResultItem, EditorMode, BatchStats } from '@/lib/types';
import { createBrowserSupabase } from '@/lib/supabase';
import '@/styles/editor.css';

// ── State ──────────────────────────────────────────────────────────────────
interface EditorState {
  images: QueuedImage[];
  results: ResultItem[];
  mode: EditorMode;
  selectedTemplateId: string | null;
  selectedPresetId: string | null;
  presetInputValues: Record<string, string>;
  customPrompt: string;
  processing: boolean;
  tokenBalance: number;
}

type Action =
  | { type: 'ADD_IMAGES'; files: File[] }
  | { type: 'TOGGLE_IMAGE'; id: string }
  | { type: 'REMOVE_IMAGE'; id: string }
  | { type: 'SELECT_ALL' }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'SET_TEMPLATE'; id: string }
  | { type: 'SET_PRESET'; id: string }
  | { type: 'SET_PRESET_INPUT'; key: string; value: string }
  | { type: 'SET_CUSTOM_PROMPT'; value: string }
  | { type: 'SET_PROCESSING'; value: boolean }
  | { type: 'SET_TOKEN_BALANCE'; value: number }
  | { type: 'UPDATE_IMAGE_STATUS'; id: string; status: QueuedImage['status']; outputUrl?: string; error?: string; jobId?: string }
  | { type: 'ADD_RESULT'; result: ResultItem }
  | { type: 'TOGGLE_RESULT'; id: string }
  | { type: 'DELETE_RESULT'; id: string }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'ABORT' };

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'ADD_IMAGES': {
      const newImages: QueuedImage[] = action.files.map(f => ({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        name: f.name,
        status: 'queued',
        selected: true,
      }));
      return { ...state, images: [...state.images, ...newImages] };
    }
    case 'TOGGLE_IMAGE':
      return { ...state, images: state.images.map(i => i.id === action.id ? { ...i, selected: !i.selected } : i) };
    case 'REMOVE_IMAGE':
      return { ...state, images: state.images.filter(i => i.id !== action.id) };
    case 'SELECT_ALL':
      return { ...state, images: state.images.map(i => ({ ...i, selected: true })) };
    case 'DESELECT_ALL':
      return { ...state, images: state.images.map(i => ({ ...i, selected: false })) };
    case 'SET_MODE':
      return { ...state, mode: action.mode, selectedTemplateId: null, selectedPresetId: null };
    case 'SET_TEMPLATE':
      return { ...state, selectedTemplateId: action.id, selectedPresetId: null };
    case 'SET_PRESET':
      return { ...state, selectedPresetId: action.id, selectedTemplateId: null, presetInputValues: {} };
    case 'SET_PRESET_INPUT':
      return { ...state, presetInputValues: { ...state.presetInputValues, [action.key]: action.value } };
    case 'SET_CUSTOM_PROMPT':
      return { ...state, customPrompt: action.value };
    case 'SET_PROCESSING':
      return { ...state, processing: action.value };
    case 'SET_TOKEN_BALANCE':
      return { ...state, tokenBalance: action.value };
    case 'UPDATE_IMAGE_STATUS':
      return {
        ...state,
        images: state.images.map(i =>
          i.id === action.id
            ? { ...i, status: action.status, outputUrl: action.outputUrl, error: action.error, jobId: action.jobId ?? i.jobId }
            : i
        ),
      };
    case 'ADD_RESULT':
      return { ...state, results: [...state.results, action.result] };
    case 'TOGGLE_RESULT':
      return { ...state, results: state.results.map(r => r.id === action.id ? { ...r, selected: !r.selected } : r) };
    case 'DELETE_RESULT': {
      const target = state.results.find(r => r.id === action.id);
      return {
        ...state,
        results: state.results.filter(r => r.id !== action.id),
        images: state.images.map(i =>
          i.id === target?.imageId ? { ...i, status: 'queued', outputUrl: undefined, error: undefined } : i
        ),
      };
    }
    case 'CLEAR_RESULTS': {
      const doneIds = new Set(state.results.map(r => r.imageId));
      return {
        ...state,
        results: [],
        images: state.images.map(i =>
          doneIds.has(i.id) ? { ...i, status: 'queued', outputUrl: undefined, error: undefined } : i
        ),
      };
    }
    case 'ABORT':
      return {
        ...state,
        processing: false,
        images: state.images.map(i => i.status === 'processing' ? { ...i, status: 'queued' } : i),
      };
    default:
      return state;
  }
}

const INITIAL_STATE: EditorState = {
  images: [],
  results: [],
  mode: 'actions',
  selectedTemplateId: null,
  selectedPresetId: null,
  presetInputValues: {},
  customPrompt: '',
  processing: false,
  tokenBalance: 0,
};

type MobilePanel = 'upload' | 'templates' | 'results';

export default function EditorPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('upload');
  const abortRef = useRef(false);

  // ── Load token balance on mount ────────────────────────────────────────
  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      if (data?.balance != null) dispatch({ type: 'SET_TOKEN_BALANCE', value: data.balance });
    });
  }, []);

  // ── Poll active jobs every 4 seconds ──────────────────────────────────
  useEffect(() => {
    const activeJobs = state.images.filter(i => i.status === 'processing' && i.jobId);
    if (!activeJobs.length) return;

    const ids = activeJobs.map(i => i.jobId!).join(',');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs?ids=${ids}`);
        if (!res.ok) return;
        const { jobs } = await res.json() as {
          jobs: Array<{ id: string; status: string; output_url?: string; error?: string }>;
        };

        for (const job of jobs) {
          if (job.status === 'succeeded' && job.output_url) {
            const image = state.images.find(i => i.jobId === job.id);
            if (!image) continue;
            dispatch({ type: 'UPDATE_IMAGE_STATUS', id: image.id, status: 'done', outputUrl: job.output_url });
            dispatch({
              type: 'ADD_RESULT',
              result: {
                id: crypto.randomUUID(),
                imageId: image.id,
                imageName: image.name,
                inputUrl: image.previewUrl,
                outputUrl: job.output_url,
                selected: false,
              },
            });
            setProcessingIds(prev => { const s = new Set(prev); s.delete(image.id); return s; });
          } else if (job.status === 'failed') {
            const image = state.images.find(i => i.jobId === job.id);
            if (!image) continue;
            dispatch({ type: 'UPDATE_IMAGE_STATUS', id: image.id, status: 'failed', error: job.error ?? 'Failed' });
            setProcessingIds(prev => { const s = new Set(prev); s.delete(image.id); return s; });
          }
        }

        const stillProcessing = state.images.filter(i => i.status === 'processing').length;
        if (stillProcessing === 0) dispatch({ type: 'SET_PROCESSING', value: false });
      } catch {
        // Polling errors are non-fatal; retry next tick.
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [state.images]);

  const handleAdd = useCallback((files: File[]) => dispatch({ type: 'ADD_IMAGES', files }), []);
  const handleToggle = useCallback((id: string) => dispatch({ type: 'TOGGLE_IMAGE', id }), []);
  const handleRemove = useCallback((id: string) => dispatch({ type: 'REMOVE_IMAGE', id }), []);
  const handleSelectAll = useCallback(() => dispatch({ type: 'SELECT_ALL' }), []);
  const handleDeselectAll = useCallback(() => dispatch({ type: 'DESELECT_ALL' }), []);

  const batchStats: BatchStats = {
    total: state.images.filter(i => i.selected).length,
    done: state.images.filter(i => i.status === 'done').length,
    processing: state.images.filter(i => i.status === 'processing').length,
    failed: state.images.filter(i => i.status === 'failed').length,
  };

  const handleProcessAll = async () => {
    const selected = state.images.filter(i => i.selected && i.status === 'queued');
    if (!selected.length) return;

    abortRef.current = false;
    dispatch({ type: 'SET_PROCESSING', value: true });

    const actionId = state.selectedTemplateId ?? state.selectedPresetId;
    if (!actionId) return;

    const CONCURRENCY = 5;
    const queue = [...selected];
    let active = 0;

    const processNext = async () => {
      if (!queue.length || active >= CONCURRENCY || abortRef.current) return;
      const img = queue.shift()!;
      active++;

      dispatch({ type: 'UPDATE_IMAGE_STATUS', id: img.id, status: 'processing' });
      setProcessingIds(prev => new Set([...prev, img.id]));

      try {
        // Step 1: upload original image to shared hosting.
        const uploadForm = new FormData();
        uploadForm.append('file', img.file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
        if (!uploadRes.ok) throw new Error('Upload failed');
        const { jobId, inputUrl } = await uploadRes.json() as { jobId: string; inputUrl: string };

        // Step 2: dispatch processing job to Replicate via /api/process.
        const processRes = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            inputUrl,
            actionId,
            bgPrompt: state.customPrompt || undefined,
          }),
        });

        if (!processRes.ok) {
          const { error } = await processRes.json();
          throw new Error(error ?? 'Process failed');
        }

        // Store jobId on the image so the polling loop can track it.
        dispatch({ type: 'UPDATE_IMAGE_STATUS', id: img.id, status: 'processing', jobId });

      } catch (err) {
        dispatch({
          type: 'UPDATE_IMAGE_STATUS',
          id: img.id,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Processing failed',
        });
        setProcessingIds(prev => { const s = new Set(prev); s.delete(img.id); return s; });
      } finally {
        active--;
        if (queue.length && !abortRef.current) processNext();
        else if (active === 0 && !queue.length) {
          // All dispatched; polling loop will clear processing flag when jobs complete.
        }
      }
    };

    for (let i = 0; i < Math.min(CONCURRENCY, selected.length); i++) {
      processNext();
    }
  };

  const handleAbort = () => {
    abortRef.current = true;
    dispatch({ type: 'ABORT' });
    setProcessingIds(new Set());
  };

  const handleDeleteResult = (id: string) => dispatch({ type: 'DELETE_RESULT', id });
  const handleClearResults = () => dispatch({ type: 'CLEAR_RESULTS' });

  const handleDownloadSelected = async () => {
    const selected = state.results.filter(r => r.selected && r.outputUrl);
    if (!selected.length) return;
    const urls = selected.map(r => ({ filename: `result-${r.imageName}`, url: r.outputUrl }));
    triggerZipDownload(urls);
  };

  const handleDownloadAll = async () => {
    const all = state.results.filter(r => r.outputUrl);
    if (!all.length) return;
    const urls = all.map(r => ({ filename: `result-${r.imageName}`, url: r.outputUrl }));
    triggerZipDownload(urls);
  };

  const triggerZipDownload = async (urls: Array<{ filename: string; url: string }>) => {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ai-studio-results.zip';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const selectedCount = state.images.filter(i => i.selected).length;

  return (
    <div className="aipe-wrap">
      <div className="aipe-header" style={{ flexShrink: 0 }}>
        <h1>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
          </svg>
          AI Studio
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="aipe-token-stat__value--balance" style={{ fontSize: 13, fontWeight: 600 }}>
            {state.tokenBalance} tokens
          </span>
          <a href="/admin/settings" className="aipe-settings-link">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Settings
          </a>
        </div>
      </div>

      <div className="aipe-layout">
        <UploadPanel
          images={state.images}
          onAdd={handleAdd}
          onToggle={handleToggle}
          onRemove={handleRemove}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          className={mobilePanel === 'upload' ? 'aipe-panel--mobile-active' : ''}
        />
        <TemplatesPanel
          mode={state.mode}
          onModeChange={m => dispatch({ type: 'SET_MODE', mode: m })}
          selectedTemplateId={state.selectedTemplateId}
          selectedPresetId={state.selectedPresetId}
          onSelectTemplate={id => dispatch({ type: 'SET_TEMPLATE', id })}
          onSelectPreset={id => dispatch({ type: 'SET_PRESET', id })}
          presetInputValues={state.presetInputValues}
          onPresetInputChange={(key, value) => dispatch({ type: 'SET_PRESET_INPUT', key, value })}
          customPrompt={state.customPrompt}
          onCustomPromptChange={v => dispatch({ type: 'SET_CUSTOM_PROMPT', value: v })}
          selectedImageCount={selectedCount}
          processing={state.processing}
          batchStats={batchStats}
          onProcessAll={handleProcessAll}
          onAbort={handleAbort}
          className={mobilePanel === 'templates' ? 'aipe-panel--mobile-active' : ''}
        />
        <ResultsPanel
          results={state.results}
          processingIds={processingIds}
          onToggleResult={id => dispatch({ type: 'TOGGLE_RESULT', id })}
          onDeleteResult={handleDeleteResult}
          onClearResults={handleClearResults}
          onDownloadSelected={handleDownloadSelected}
          onDownloadAll={handleDownloadAll}
          onRetry={imageId => dispatch({ type: 'UPDATE_IMAGE_STATUS', id: imageId, status: 'queued' })}
          className={mobilePanel === 'results' ? 'aipe-panel--mobile-active' : ''}
        />
      </div>

      <div className="aipe-mobile-tabs">
        <button
          className={`aipe-mobile-tab${mobilePanel === 'upload' ? ' aipe-mobile-tab--active' : ''}`}
          onClick={() => setMobilePanel('upload')}
        >
          {state.images.length > 0 && <span className="aipe-mobile-tab__badge">{state.images.length}</span>}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload
        </button>
        <button
          className={`aipe-mobile-tab${mobilePanel === 'templates' ? ' aipe-mobile-tab--active' : ''}`}
          onClick={() => setMobilePanel('templates')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Edit
        </button>
        <button
          className={`aipe-mobile-tab${mobilePanel === 'results' ? ' aipe-mobile-tab--active' : ''}`}
          onClick={() => setMobilePanel('results')}
        >
          {state.results.length > 0 && <span className="aipe-mobile-tab__badge">{state.results.length}</span>}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Results
        </button>
      </div>
    </div>
  );
}
