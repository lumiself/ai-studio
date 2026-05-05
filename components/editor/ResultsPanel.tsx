'use client';
import { useState } from 'react';
import type { ResultItem, ResultFilter } from '@/lib/types';

interface Props {
  results: ResultItem[];
  processingIds: Set<string>;
  onToggleResult: (id: string) => void;
  onDeleteResult: (id: string) => void;
  onClearResults: () => void;
  onDownloadSelected: () => void;
  onDownloadAll: () => void;
  onRetry: (imageId: string) => void;
  className?: string;
}

interface LightboxItem { inputUrl: string; outputUrl: string; name: string; }

export default function ResultsPanel({ results, processingIds, onToggleResult, onDeleteResult, onClearResults, onDownloadSelected, onDownloadAll, onRetry, className = '' }: Props) {
  const [filter, setFilter] = useState<ResultFilter>('all');
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [showBefore, setShowBefore] = useState(false);

  const selectedCount = results.filter(r => r.selected).length;

  const visibleResults = filter === 'all'        ? results
    : filter === 'done'       ? results.filter(r => r.outputUrl)
    : filter === 'processing' ? results.filter(r => processingIds.has(r.imageId))
    : results.filter(r => !r.outputUrl && !processingIds.has(r.imageId));

  return (
    <div className={`aipe-panel aipe-panel--results ${className}`}>
      {/* Fixed header */}
      <div className="aipe-panel__header">
        <div className="aipe-panel__title-row">
          <p className="aipe-panel__title">Results</p>
          <span className="aipe-count-badge">{results.length} total</span>
        </div>
        {/* Filter chips stay visible always */}
        {results.length > 0 && (
          <div className="aipe-filter-chips" style={{ marginTop: 10, marginBottom: 0 }}>
            {(['all', 'done', 'processing', 'failed'] as ResultFilter[]).map(f => (
              <button
                key={f}
                className={`aipe-filter-chip aipe-filter-chip--${f}${filter === f ? ' aipe-filter-chip--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable body — results grid grows here */}
      <div className="aipe-panel__body">
        {results.length === 0 ? (
          <div className="aipe-results-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Processed images will appear here in real-time.</p>
          </div>
        ) : (
          <ul className="aipe-results-grid">
            {visibleResults.map(r => {
              const isProcessing = processingIds.has(r.imageId);
              const isFailed = !r.outputUrl && !isProcessing;
              return (
                <li key={r.id} className={`aipe-result-card${r.selected ? ' aipe-result-card--checked' : ''}${isProcessing ? ' aipe-result-card--processing' : ''}${isFailed ? ' aipe-result-card--error' : ''}`}>
                  <span className="aipe-result-card__check-badge">✓</span>
                  <button className="aipe-result-card__delete" onClick={e => { e.stopPropagation(); onDeleteResult(r.id); }} title="Delete">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  {isProcessing && (<><div className="aipe-spinner" /><p className="aipe-progress-label">Processing…</p></>)}
                  {isFailed && (<><p className="aipe-result-card__err-label">Failed</p><button className="aipe-result-card__retry" onClick={() => onRetry(r.imageId)}>Retry</button></>)}
                  {r.outputUrl && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.outputUrl} alt={r.imageName} className="aipe-result-card__img" />
                      <div className="aipe-result-card__overlay">
                        <span className="aipe-result-card__name">{r.imageName}</span>
                        <button className="aipe-result-card__btn" onClick={() => { setLightbox({ inputUrl: r.inputUrl, outputUrl: r.outputUrl, name: r.imageName }); setShowBefore(false); }}>⤢ Compare</button>
                        <button className="aipe-result-card__btn" onClick={e => { e.stopPropagation(); onToggleResult(r.id); }}>{r.selected ? '✓ Selected' : '+ Select'}</button>
                        <a href={`/api/download?url=${encodeURIComponent(r.outputUrl)}&filename=${encodeURIComponent(r.imageName)}`} className="aipe-result-card__btn">↓ Save</a>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pinned footer — download buttons always visible */}
      {results.length > 0 && (
        <div className="aipe-panel__footer">
          <div className="aipe-results-actions" style={{ marginBottom: 0 }}>
            <button className="aipe-btn aipe-btn--secondary" disabled={selectedCount === 0} onClick={onDownloadSelected}>
              ↓ Selected ({selectedCount})
            </button>
            <button className="aipe-btn aipe-btn--secondary" onClick={onDownloadAll}>
              ↓ All
            </button>
            <button className="aipe-btn aipe-btn--danger" onClick={onClearResults}>
              ✕ Clear All
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="aipe-lightbox" onClick={() => setLightbox(null)}>
          <div className="aipe-lightbox__inner" onClick={e => e.stopPropagation()}>
            <div className="aipe-lightbox__header">
              <h3 className="aipe-lightbox__title">{lightbox.name}</h3>
              <button className="aipe-lightbox__close" onClick={() => setLightbox(null)}>✕</button>
            </div>
            <div className="aipe-lightbox__images">
              <div className="aipe-lightbox__img-wrap">
                <span className="aipe-lightbox__img-label">Before</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lightbox.inputUrl} alt="Before" className="aipe-lightbox__img" />
              </div>
              <div className="aipe-lightbox__img-wrap">
                <span className="aipe-lightbox__img-label">After</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={showBefore ? lightbox.inputUrl : lightbox.outputUrl} alt="After" className="aipe-lightbox__img" />
              </div>
            </div>
            <button className="aipe-lightbox__toggle-btn" onClick={() => setShowBefore(b => !b)}>
              {showBefore ? 'Show After' : 'Show Before (right pane)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
