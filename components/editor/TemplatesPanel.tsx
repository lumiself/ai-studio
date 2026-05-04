'use client';
import { useState } from 'react';
import { ACTIONS, ACTION_CATEGORIES } from '@/lib/actions';
import { PRESETS, PRESET_CATEGORIES } from '@/lib/presets';
import type { EditorMode, BatchStats } from '@/lib/types';

interface Props {
  mode: EditorMode;
  onModeChange: (m: EditorMode) => void;
  selectedTemplateId: string | null;
  selectedPresetId: string | null;
  onSelectTemplate: (id: string) => void;
  onSelectPreset: (id: string) => void;
  presetInputValues: Record<string, string>;
  onPresetInputChange: (key: string, value: string) => void;
  customPrompt: string;
  onCustomPromptChange: (v: string) => void;
  selectedImageCount: number;
  processing: boolean;
  batchStats: BatchStats;
  onProcessAll: () => void;
  onAbort: () => void;
  className?: string;
}

export default function TemplatesPanel({
  mode, onModeChange,
  selectedTemplateId, selectedPresetId,
  onSelectTemplate, onSelectPreset,
  presetInputValues, onPresetInputChange,
  customPrompt, onCustomPromptChange,
  selectedImageCount, processing,
  batchStats, onProcessAll, onAbort,
  className = '',
}: Props) {
  const [actionCat, setActionCat] = useState('All');
  const [presetCat, setPresetCat] = useState('All');

  const visibleActions = actionCat === 'All' ? ACTIONS : ACTIONS.filter(a => a.category === actionCat);
  const visiblePresets = presetCat === 'All' ? PRESETS : PRESETS.filter(p => p.category === presetCat);

  const selectedPreset  = PRESETS.find(p => p.id === selectedPresetId);
  const selectedAction  = ACTIONS.find(a => a.id === selectedTemplateId);
  const showPrompt = mode === 'actions' && selectedAction?.has_prompt;

  const progressPct = batchStats.total > 0
    ? Math.round((batchStats.done + batchStats.failed) / batchStats.total * 100)
    : 0;

  return (
    <div className={`aipe-panel aipe-panel--templates ${className}`}>
      {/* Fixed header */}
      <div className="aipe-panel__header">
        <div className="aipe-panel__title-row">
          <p className="aipe-panel__title">Edit Action</p>
        </div>
        {/* Mode switcher sits in header so it's always visible */}
        <div className="aipe-mode-switcher" style={{ marginTop: 12, marginBottom: 0 }}>
          <button
            className={`aipe-mode-btn${mode === 'actions' ? ' aipe-mode-btn--active' : ''}`}
            onClick={() => onModeChange('actions')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Actions
          </button>
          <button
            className={`aipe-mode-btn${mode === 'presets' ? ' aipe-mode-btn--active' : ''}`}
            onClick={() => onModeChange('presets')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Presets
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="aipe-panel__body">
        {/* ── Actions tab ── */}
        {mode === 'actions' && (
          <>
            <div className="aipe-category-tabs">
              {['All', ...ACTION_CATEGORIES].map(cat => (
                <button key={cat} className={`aipe-tab${actionCat === cat ? ' aipe-tab--active' : ''}`} onClick={() => setActionCat(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="aipe-template-grid">
              {visibleActions.map(a => (
                <button
                  key={a.id}
                  className="aipe-template-card"
                  aria-checked={selectedTemplateId === a.id}
                  onClick={() => onSelectTemplate(a.id)}
                  title={a.description}
                >
                  <span className="aipe-template-card__icon" style={{ fontSize: 22 }}>{a.icon}</span>
                  <span className="aipe-template-card__name">{a.name}</span>
                </button>
              ))}
            </div>
            {showPrompt && (
              <div className="aipe-prompt-area">
                <label className="aipe-prompt-area__label">{selectedAction?.prompt_label ?? 'Describe the background:'}</label>
                <textarea
                  className="aipe-prompt-area__input"
                  rows={3}
                  placeholder="e.g. A tropical beach at sunset with palm trees…"
                  value={customPrompt}
                  onChange={e => onCustomPromptChange(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {/* ── Presets tab ── */}
        {mode === 'presets' && (
          <>
            <div className="aipe-category-tabs">
              {['All', ...PRESET_CATEGORIES].map(cat => (
                <button key={cat} className={`aipe-tab${presetCat === cat ? ' aipe-tab--active' : ''}`} onClick={() => setPresetCat(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="aipe-preset-grid">
              {visiblePresets.map(p => (
                <button
                  key={p.id}
                  className="aipe-preset-card"
                  aria-checked={selectedPresetId === p.id}
                  data-category={p.category}
                  onClick={() => onSelectPreset(p.id)}
                  title={p.description}
                >
                  <div className="aipe-preset-card__thumb-wrap">
                    <span className="aipe-preset-card__thumb-placeholder">🖼</span>
                  </div>
                  <span className="aipe-preset-card__name">{p.name}</span>
                </button>
              ))}
            </div>
            {selectedPreset && selectedPreset.inputs.length > 0 && (
              <div className="aipe-preset-inputs">
                {selectedPreset.inputs.map(input => (
                  <div key={input.id} className="aipe-preset-input-group">
                    <label className="aipe-preset-input-label">
                      {input.label}{input.required && <span className="aipe-required-star"> *</span>}
                    </label>
                    <input
                      className="aipe-preset-input-field"
                      type={input.type}
                      placeholder={input.placeholder}
                      min={input.min}
                      max={input.max}
                      value={presetInputValues[input.id] ?? ''}
                      onChange={e => onPresetInputChange(input.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pinned footer — process button always visible */}
      <div className="aipe-panel__footer">
        {!processing ? (
          <>
            <button
              className="aipe-btn aipe-btn--primary"
              disabled={selectedImageCount === 0 || (!selectedTemplateId && !selectedPresetId)}
              onClick={onProcessAll}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Process All Selected ({selectedImageCount})
            </button>
            {selectedImageCount === 0 && (
              <p className="aipe-process-hint">Select images from the upload queue to continue.</p>
            )}
          </>
        ) : (
          <>
            <div className="aipe-batch-progress">
              <div className="aipe-batch-progress__header">
                <span className="aipe-batch-progress__label">Processing batch…</span>
                <span className="aipe-batch-progress__count">{batchStats.done + batchStats.failed} / {batchStats.total}</span>
              </div>
              <div className="aipe-batch-progress__track">
                <div className="aipe-batch-progress__fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="aipe-batch-progress__sub">
                <span><span className="aipe-batch-progress__dot aipe-batch-progress__dot--processing" />{batchStats.processing} in progress</span>
                <span><span className="aipe-batch-progress__dot aipe-batch-progress__dot--done" />{batchStats.done} done</span>
                {batchStats.failed > 0 && <span><span className="aipe-batch-progress__dot aipe-batch-progress__dot--failed" />{batchStats.failed} failed</span>}
              </div>
            </div>
            <button className="aipe-btn aipe-btn--danger" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={onAbort}>
              Abort All
            </button>
          </>
        )}
      </div>
    </div>
  );
}
