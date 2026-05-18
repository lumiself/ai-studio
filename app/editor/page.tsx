'use client';
import { useReducer, useCallback, useState, useEffect, useRef } from 'react';
import UploadPanel from '@/components/editor/UploadPanel';
import TemplatesPanel from '@/components/editor/TemplatesPanel';
import ResultsPanel from '@/components/editor/ResultsPanel';
import type { QueuedImage, ResultItem, EditorMode, BatchStats, LibraryImage, Preset } from '@/lib/types';
import { createBrowserSupabase } from '@/lib/supabase/client';
import '@/styles/editor.css';

// ── State ──────────────────────────────────────────────────────────────────
interface EditorState {
  images: QueuedImage[];
  results: ResultItem[];
  libraryImages: LibraryImage[];
  mode: EditorMode;
  selectedTemplateId: string | null;
  selectedPresetId: string | null;
  presetInputValues: Record<string, string>;
  customPrompt: string;
  highRes: boolean;
  lessStrict: boolean;
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
  | { type: 'TOGGLE_HIGH_RES' }
  | { type: 'TOGGLE_LESS_STRICT' }
  | { type: 'SET_PROCESSING'; value: boolean }
  | { type: 'SET_TOKEN_BALANCE'; value: number }
  | { type: 'UPDATE_IMAGE_STATUS'; id: string; status: QueuedImage['status']; outputUrl?: string; error?: string; jobId?: string }
  | { type: 'ADD_RESULT'; result: ResultItem }
  | { type: 'LOAD_HISTORY'; results: ResultItem[] }
  | { type: 'LOAD_LIBRARY'; images: LibraryImage[] }
  | { type: 'ADD_TO_LIBRARY'; image: LibraryImage }
  | { type: 'REMOVE_LIBRARY_IMAGE'; id: string }
  | { type: 'ADD_IMAGE_FROM_URL'; url: string; name: string }
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
    case 'TOGGLE_HIGH_RES':
      return { ...state, highRes: !state.highRes };
    case 'TOGGLE_LESS_STRICT':
      return { ...state, lessStrict: !state.lessStrict };
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
    case 'LOAD_HISTORY':
      return { ...state, results: [...action.results, ...state.results] };
    case 'LOAD_LIBRARY':
      return { ...state, libraryImages: action.images };
    case 'ADD_TO_LIBRARY':
      return { ...state, libraryImages: [action.image, ...state.libraryImages] };
    case 'REMOVE_LIBRARY_IMAGE':
      return { ...state, libraryImages: state.libraryImages.filter(i => i.id !== action.id) };
    case 'ADD_IMAGE_FROM_URL': {
      const newImage: QueuedImage = {
        id: crypto.randomUUID(),
        inputUrl: action.url,
        previewUrl: action.url,
        name: action.name,
        status: 'queued',
        selected: true,
      };
      return { ...state, images: [...state.images, newImage] };
    }
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
  libraryImages: [],
  mode: 'actions',
  selectedTemplateId: null,
  selectedPresetId: null,
  presetInputValues: {},
  customPrompt: '',
  highRes: false,
  lessStrict: false,
  processing: false,
  tokenBalance: 0,
};

type MobilePanel = 'upload' | 'templates' | 'results';

export default function EditorPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const abortRef = useRef(false);
  const imagesRef = useRef(state.images);
  useEffect(() => { imagesRef.current = state.images; }, [state.images]);

  // ── Load custom presets on mount ──────────────────────────────────────
  useEffect(() => {
    fetch('/api/presets')
      .then(r => r.ok ? r.json() : null)
      .then((data: { presets: Array<{ id: string; name: string; description: string; category: string; thumbnail_url: string | null; pipeline: string; bg_prompt: string; inputs: Preset['inputs'] }> } | null) => {
        if (!data?.presets?.length) return;
        setCustomPresets(data.presets.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description ?? '',
          category: p.category,
          thumbnail: p.thumbnail_url ?? undefined,
          pipeline: p.pipeline ?? 'gpt_bg',
          bg_prompt: p.bg_prompt ?? '',
          inputs: p.inputs ?? [],
        })));
      })
      .catch(() => {});
  }, []);

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

  // ── Load previous results and library on mount ────────────────────────
  useEffect(() => {
    fetch('/api/jobs?history=true')
      .then(r => r.ok ? r.json() : null)
      .then((data: { jobs: Array<{ id: string; input_url: string; output_url: string; action_id: string }> } | null) => {
        if (!data?.jobs?.length) return;

        const results: ResultItem[] = data.jobs.map(j => ({
          id: j.id,
          imageId: j.id,
          imageName: j.input_url.split('/').pop() ?? j.action_id,
          inputUrl: j.input_url,
          outputUrl: j.output_url,
          selected: false,
        }));
        dispatch({ type: 'LOAD_HISTORY', results });

        // Unique input URLs → library panel
        const seen = new Set<string>();
        const libraryImages: LibraryImage[] = [];
        for (const j of data.jobs) {
          if (!seen.has(j.input_url)) {
            seen.add(j.input_url);
            libraryImages.push({
              id: crypto.randomUUID(),
              url: j.input_url,
              name: j.input_url.split('/').pop() ?? 'image',
            });
          }
        }
        if (libraryImages.length) dispatch({ type: 'LOAD_LIBRARY', images: libraryImages });
      })
      .catch(() => {});
  }, []);

  // ── Subscribe to job updates via Supabase Realtime ────────────────────
  useEffect(() => {
    const supabase = createBrowserSupabase();
    let channel: ReturnType<typeof supabase.channel> | undefined;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel('job-updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const job = payload.new as { id: string; status: string; output_url: string | null; error: string | null };
            const image = imagesRef.current.find(i => i.jobId === job.id);
            if (!image) return;

            if (job.status === 'succeeded' && job.output_url) {
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
              dispatch({ type: 'UPDATE_IMAGE_STATUS', id: image.id, status: 'failed', error: job.error ?? 'Failed' });
              setProcessingIds(prev => { const s = new Set(prev); s.delete(image.id); return s; });
            }
          }
        )
        .subscribe();
    });

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // Fallback polling — catches completions that Realtime missed (dropped subscription, etc.)
  useEffect(() => {
    const processingImages = imagesRef.current.filter(i => i.status === 'processing' && i.jobId);
    if (processingImages.length === 0) return;

    const ids = processingImages.map(i => i.jobId!).join(',');
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs?ids=${ids}`);
        if (!res.ok || cancelled) return;
        const { jobs } = await res.json() as { jobs: { id: string; status: string; output_url: string | null; error: string | null }[] };
        for (const job of jobs) {
          if (cancelled) break;
          const image = imagesRef.current.find(i => i.jobId === job.id);
          if (!image) continue;
          if (job.status === 'succeeded' && job.output_url) {
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
            dispatch({ type: 'UPDATE_IMAGE_STATUS', id: image.id, status: 'failed', error: job.error ?? 'Failed' });
            setProcessingIds(prev => { const s = new Set(prev); s.delete(image.id); return s; });
          }
        }
      } catch {
        // silent — Realtime is primary, this is best-effort
      }
    };

    const timer = setInterval(poll, 4000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [processingIds]);

  // Realtime delivers updates asynchronously; watch reactively to clear the processing flag.
  useEffect(() => {
    if (state.processing && !state.images.some(i => i.status === 'processing')) {
      dispatch({ type: 'SET_PROCESSING', value: false });
    }
  }, [state.images, state.processing]);

  const handleUploadToServer = useCallback(async (files: File[]): Promise<boolean> => {
    setUploading(true);
    setUploadError(null);
    try {
      // Get a short-lived token so the browser can upload directly to storage,
      // bypassing Vercel's body size limit entirely.
      const tokenRes = await fetch('/api/upload-token');
      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Failed to get upload token');
      }
      const { token, uploadUrl } = await tokenRes.json() as { token: string; uploadUrl: string };

      await Promise.all(files.map(async (file) => {
        const jobId = crypto.randomUUID();
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const filename = `${jobId}.${ext}`;

        const formData = new FormData();
        formData.append('folder', 'uploads');
        formData.append('filename', filename);
        formData.append('file', file);

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'X-Upload-Token': token },
          body: formData,
        });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `Upload failed (${uploadRes.status})`);
        }
        const { url: inputUrl } = await uploadRes.json() as { url: string };

        // Register with server to create thumbnail (small JSON request, no file body)
        const regRes = await fetch('/api/register-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId, inputUrl }),
        });
        const { thumbUrl } = regRes.ok
          ? await regRes.json() as { thumbUrl?: string }
          : {};

        dispatch({ type: 'ADD_TO_LIBRARY', image: { id: jobId, url: inputUrl, thumbUrl, name: file.name } });
      }));
      return true;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      return false;
    } finally {
      setUploading(false);
    }
  }, []);
  const handleToggle = useCallback((id: string) => dispatch({ type: 'TOGGLE_IMAGE', id }), []);
  const handleRemove = useCallback((id: string) => dispatch({ type: 'REMOVE_IMAGE', id }), []);
  const handleAddFromLibrary = useCallback((img: LibraryImage) => {
    dispatch({ type: 'ADD_IMAGE_FROM_URL', url: img.url, name: img.name });
  }, []);
  const handleDeleteFromLibrary = useCallback(async (img: LibraryImage) => {
    try {
      await fetch('/api/delete-upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputUrl: img.url }),
      });
    } catch {
      // Non-fatal — remove from UI regardless
    }
    dispatch({ type: 'REMOVE_LIBRARY_IMAGE', id: img.id });
  }, []);
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

    const CONCURRENCY = 2;
    const queue = [...selected];
    let active = 0;

    const processNext = async () => {
      if (!queue.length || active >= CONCURRENCY || abortRef.current) return;
      const img = queue.shift()!;
      active++;

      dispatch({ type: 'UPDATE_IMAGE_STATUS', id: img.id, status: 'processing' });
      setProcessingIds(prev => new Set([...prev, img.id]));

      try {
        let jobId: string;
        let inputUrl: string;

        if (img.inputUrl) {
          // History image — already on storage, skip upload.
          jobId = crypto.randomUUID();
          inputUrl = img.inputUrl;
        } else {
          // New file — upload to shared hosting first.
          const uploadForm = new FormData();
          uploadForm.append('file', img.file!);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
          if (!uploadRes.ok) throw new Error('Upload failed');
          ({ jobId, inputUrl } = await uploadRes.json() as { jobId: string; inputUrl: string });
        }

        // Step 2: dispatch processing job to Replicate via /api/process.
        const processRes = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            inputUrl,
            actionId,
            bgPrompt: state.customPrompt || undefined,
            presetInputValues: Object.keys(state.presetInputValues).length > 0 ? state.presetInputValues : undefined,
            highRes: state.highRes || undefined,
            lessStrict: state.lessStrict || undefined,
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
          libraryImages={state.libraryImages}
          onUploadToServer={handleUploadToServer}
          onToggle={handleToggle}
          onRemove={handleRemove}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onAddFromLibrary={handleAddFromLibrary}
          onDeleteFromLibrary={handleDeleteFromLibrary}
          uploading={uploading}
          uploadError={uploadError}
          className={mobilePanel === 'upload' ? 'aipe-panel--mobile-active' : ''}
        />
        <TemplatesPanel
          mode={state.mode}
          onModeChange={m => dispatch({ type: 'SET_MODE', mode: m })}
          customPresets={customPresets}
          selectedTemplateId={state.selectedTemplateId}
          selectedPresetId={state.selectedPresetId}
          onSelectTemplate={id => dispatch({ type: 'SET_TEMPLATE', id })}
          onSelectPreset={id => dispatch({ type: 'SET_PRESET', id })}
          presetInputValues={state.presetInputValues}
          onPresetInputChange={(key, value) => dispatch({ type: 'SET_PRESET_INPUT', key, value })}
          customPrompt={state.customPrompt}
          onCustomPromptChange={v => dispatch({ type: 'SET_CUSTOM_PROMPT', value: v })}
          highRes={state.highRes}
          onHighResChange={() => dispatch({ type: 'TOGGLE_HIGH_RES' })}
          lessStrict={state.lessStrict}
          onLessStrictChange={() => dispatch({ type: 'TOGGLE_LESS_STRICT' })}
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
