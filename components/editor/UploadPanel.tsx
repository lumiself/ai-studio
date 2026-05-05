'use client';
import { useRef, useCallback, useState } from 'react';
import type { QueuedImage, LibraryImage } from '@/lib/types';

interface Props {
  images: QueuedImage[];
  libraryImages: LibraryImage[];
  onUploadToServer: (files: File[]) => Promise<void>;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAddFromLibrary: (img: LibraryImage) => void;
  onDeleteFromLibrary: (img: LibraryImage) => void;
  uploading?: boolean;
  className?: string;
}

export default function UploadPanel({
  images, libraryImages, onUploadToServer, onToggle, onRemove,
  onSelectAll, onDeselectAll, onAddFromLibrary, onDeleteFromLibrary, uploading = false, className = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'upload' | 'library'>('upload');

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    await onUploadToServer(imgs);
    setTab('library');
  }, [onUploadToServer]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('aipe-drop-zone--dragover');
    handleFiles(e.dataTransfer.files); // fire-and-forget intentional in event handler
  };

  const selectedCount = images.filter(i => i.selected).length;

  const statusLabel = (img: QueuedImage) => {
    if (img.status === 'processing') return 'Processing…';
    if (img.status === 'done')       return 'Done';
    if (img.status === 'failed')     return img.error ?? 'Failed';
    return 'Queued';
  };

  return (
    <div className={`aipe-panel aipe-panel--upload ${className}`}>
      {/* Fixed header */}
      <div className="aipe-panel__header">
        <div className="aipe-panel__title-row">
          <p className="aipe-panel__title">Images</p>
        </div>
        <div className="aipe-panel-tabs">
          <button
            className={`aipe-panel-tab${tab === 'upload' ? ' aipe-panel-tab--active' : ''}`}
            onClick={() => setTab('upload')}
          >
            Upload
          </button>
          <button
            className={`aipe-panel-tab${tab === 'library' ? ' aipe-panel-tab--active' : ''}`}
            onClick={() => setTab('library')}
          >
            Library
            {libraryImages.length > 0 && (
              <span className="aipe-count-badge">{libraryImages.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="aipe-panel__body">

        {/* ── Upload tab ─────────────────────────────────────────── */}
        {tab === 'upload' && (
          <div
            className={`aipe-drop-zone${uploading ? ' aipe-drop-zone--loading' : ''}`}
            onClick={() => { if (!uploading) inputRef.current?.click(); }}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); if (!uploading) e.currentTarget.classList.add('aipe-drop-zone--dragover'); }}
            onDragLeave={e => e.currentTarget.classList.remove('aipe-drop-zone--dragover')}
          >
            {uploading ? (
              <>
                <svg className="aipe-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                <p className="aipe-drop-zone__label">Uploading…</p>
              </>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="aipe-drop-zone__label">Drop images here</p>
                <p className="aipe-drop-zone__hint">or click to browse — JPG, PNG, WEBP</p>
              </>
            )}
            <input
              ref={inputRef} type="file" accept="image/*" multiple
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
            />
          </div>
        )}

        {/* ── Library tab ─────────────────────────────────────────── */}
        {tab === 'library' && (
          libraryImages.length === 0 ? (
            <p className="aipe-empty-hint">No uploaded images yet. Use the Upload tab to add images.</p>
          ) : (
            <div className="aipe-library-grid">
              {libraryImages.map(img => (
                <div key={img.id} className="aipe-library-item" title={img.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="aipe-library-item__thumb"
                    onClick={() => onAddFromLibrary(img)}
                  />
                  <button
                    className="aipe-library-item__delete"
                    onClick={() => onDeleteFromLibrary(img)}
                    title="Delete from server"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <button
                    className="aipe-library-item__add"
                    onClick={() => onAddFromLibrary(img)}
                    title="Add to queue"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Queue section (always visible below tabs) ───────────── */}
        {images.length > 0 && (
          <div className="aipe-queue-section">
            <div className="aipe-queue-section__header">
              <span className="aipe-queue-section__label">Queue</span>
              <span className="aipe-count-badge">{images.length}</span>
            </div>
            <div className="aipe-bulk-controls">
              <button className="aipe-bulk-btn" onClick={onSelectAll}>Select All</button>
              <button className="aipe-bulk-btn" onClick={onDeselectAll}>Deselect All</button>
              {selectedCount > 0 && (
                <span className="aipe-count-badge" style={{ alignSelf: 'center' }}>{selectedCount} selected</span>
              )}
            </div>
            <ul className="aipe-image-list">
              {images.map(img => (
                <li
                  key={img.id}
                  className={`aipe-image-item${img.selected ? ' aipe-image-item--selected' : ''}`}
                  onClick={() => onToggle(img.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt={img.name} className="aipe-image-item__thumb" />
                  <div className="aipe-image-item__info">
                    <p className="aipe-image-item__name">{img.name}</p>
                    <p className={`aipe-image-item__status aipe-image-item__status--${img.status}`}>
                      {statusLabel(img)}
                    </p>
                  </div>
                  <button
                    className="aipe-image-item__remove"
                    onClick={e => { e.stopPropagation(); onRemove(img.id); }}
                    title="Remove"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <span className="aipe-image-item__check">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
