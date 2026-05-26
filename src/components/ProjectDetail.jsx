import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ProjectDetail({ project, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!project) return undefined;
    dialogRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [project, onClose]);

  if (!project) return null;
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div
        className="detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="detail__close" onClick={onClose}>닫기</button>
        <h2 className="detail__title" id="detail-title">{project.title}</h2>
        <p className="detail__meta">
          {project.year}
          {project.members?.length ? ` · ${project.members.join(', ')}` : ''}
        </p>
        {project.images?.map((src) => (
          <img key={src} className="detail__img" src={src} alt="" loading="lazy" />
        ))}
        <div className="detail__desc">
          <ReactMarkdown>{project.description || ''}</ReactMarkdown>
        </div>
        {project.links?.length > 0 && (
          <ul className="detail__links">
            {project.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
