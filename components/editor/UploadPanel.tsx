'use client';
import { useRef, useCallback } from 'react';
import type { QueuedImage } from '@/lib/types';

interface Props {
  images: QueuedImage[];
  onAdd: (files: File[]) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}

export default function UploadPanel({ images, onAdd, onToggle, onRemove, onSelectAll, onDeselectAll, className = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imgs.length) onAdd(imgs);
  }, [onAdd]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('aipe-drop-zone--dragover');
    handleFiles(e.dataTransfer.files);
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
          <p className="aipe-panel__title">Upload Queue</p>
          <span className="aipe-count-badge">{images.length} images</span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="aipe-panel__body">
        {/* Drop zone */}
        <div
          className="aipe-drop-zone"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('aipe-drop-zone--dragover'); }}
          onDragLeave={e => e.currentTarget.classList.remove('aipe-drop-zone--dragover')}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p className="aipe-drop-zone__label">Drop images or folders here</p>
          <p className="aipe-drop-zone__hint">or click to browse — JPG, PNG, WEBP</p>
          <input
            ref={inputRef} type="file" accept="image/*" multiple
            style={{ display: 'none' }}
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Bulk controls */}
        {images.length > 0 && (
          <div className="aipe-bulk-controls">
            <button className="aipe-bulk-btn" onClick={onSelectAll}>Select All</button>
            <button className="aipe-bulk-btn" onClick={onDeselectAll}>Deselect All</button>
            {selectedCount > 0 && (
              <span className="aipe-count-badge" style={{ alignSelf: 'center' }}>{selectedCount} selected</span>
            )}
          </div>
        )}

        {/* Image list — grows freely, panel body scrolls */}
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
    </div>
  );
}
