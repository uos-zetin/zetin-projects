import { useEffect } from 'react';

// Fullscreen image viewer with prev/next navigation (arrows, keyboard, click-backdrop to close).
export default function Lightbox({ images, index, onClose, onIndex }) {
  const open = index != null;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onIndex((index + 1) % images.length);
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, index, images, onClose, onIndex]);

  if (!open) return null;

  const go = (delta) => (e) => {
    e.stopPropagation();
    onIndex((index + delta + images.length) % images.length);
  };

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label="사진 크게 보기" onClick={onClose}>
      <button type="button" className="lb__close" onClick={onClose} aria-label="닫기">
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {images.length > 1 && (
        <button type="button" className="lb__nav lb__nav--prev" onClick={go(-1)} aria-label="이전">‹</button>
      )}

      <img className="lb__img" src={images[index]} alt={`사진 ${index + 1}`} onClick={(e) => e.stopPropagation()} />

      {images.length > 1 && (
        <button type="button" className="lb__nav lb__nav--next" onClick={go(1)} aria-label="다음">›</button>
      )}

      {images.length > 1 && <div className="lb__count">{index + 1} / {images.length}</div>}
    </div>
  );
}
