import { useEffect, useRef } from 'react';
import Placeholder from './Placeholder.jsx';

const isGithub = (link) => /github/i.test(link.url || '') || /github/i.test(link.label || '');

// Right slide-in drawer with project meta, description, build photos and action links.
export default function ProjectDetail({ project, onClose, seed = 0 }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!project) return undefined;
    drawerRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer__top">
          <span className="drawer__crumb">
            ZETIN / {project.category} / {project.year}
          </span>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="닫기">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="drawer__hero">
          <Placeholder label={project.title} seed={seed} ratio="16/9" />
        </div>

        <div className="drawer__body">
          <h2 className="drawer__title" id="drawer-title">{project.title}</h2>
          {project.summary && <p className="drawer__sum">{project.summary}</p>}

          <dl className="meta">
            <div className="meta__row">
              <dt>연도</dt>
              <dd>{project.year}</dd>
            </div>
            <div className="meta__row">
              <dt>카테고리</dt>
              <dd>{project.category}</dd>
            </div>
            {project.members?.length > 0 && (
              <div className="meta__row">
                <dt>참여 부원</dt>
                <dd>{project.members.join(', ')}</dd>
              </div>
            )}
            {project.awards && (
              <div className="meta__row">
                <dt>수상</dt>
                <dd>{project.awards}</dd>
              </div>
            )}
            {project.tech?.length > 0 && (
              <div className="meta__row">
                <dt>사용 기술</dt>
                <dd className="meta__tags">
                  {project.tech.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </dd>
              </div>
            )}
          </dl>

          {project.description && (
            <section className="drawer__sec">
              <h4>프로젝트 개요</h4>
              <p>{project.description}</p>
            </section>
          )}

          <section className="drawer__sec">
            <h4>제작 사진</h4>
            <div className="drawer__grid">
              <Placeholder label="제작 과정 1" seed={seed + 1} ratio="4/3" />
              <Placeholder label="제작 과정 2" seed={seed + 2} ratio="4/3" />
              <Placeholder label="대회 현장" seed={seed + 3} ratio="4/3" />
            </div>
          </section>

          {project.links?.length > 0 && (
            <footer className="drawer__foot">
              {project.links.map((l) => (
                <a
                  key={l.url}
                  className={'btn ' + (isGithub(l) ? 'btn--solid' : 'btn--ghost')}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {l.label}
                </a>
              ))}
            </footer>
          )}
        </div>
      </aside>
    </div>
  );
}
