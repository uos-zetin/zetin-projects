import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import Placeholder from './Placeholder.jsx';
import Lightbox from './Lightbox.jsx';
import { resolveAsset } from '../lib/asset.js';

const isGithub = (link) => /github/i.test(link.url || '') || /github/i.test(link.label || '');

// Full detail page (classic navigation). Reached at /#/project/:id.
export default function ProjectPage({ projects, loading, error }) {
  const { id } = useParams();
  const [lightbox, setLightbox] = useState(null);

  if (loading) return <p className="empty">불러오는 중…</p>;
  if (error) return <p className="empty">프로젝트를 불러오지 못했습니다.</p>;

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="empty">
        해당 프로젝트를 찾을 수 없습니다. <Link to="/">← 목록으로</Link>
      </div>
    );
  }

  const seed = projects.findIndex((p) => p.id === id);
  const heroSrc = project.thumbnail || project.images?.[0];

  // All real photos for this project (hero first), used by the lightbox.
  const photos = [...new Set([project.thumbnail, ...(project.images || [])].filter(Boolean))].map(resolveAsset);
  const openPhoto = (src) => setLightbox(photos.indexOf(resolveAsset(src)));

  return (
    <article className="page">
      <div className="page__top">
        <Link className="page__back" to="/">← 목록으로</Link>
        <span className="page__crumb">ZETIN / {project.category} / {project.year}</span>
      </div>

      <div className="page__hero">
        {heroSrc ? (
          <img
            className="page__heroimg"
            src={resolveAsset(heroSrc)}
            alt={project.title}
            onClick={() => openPhoto(heroSrc)}
          />
        ) : (
          <Placeholder label={project.title} seed={seed} ratio="16/9" />
        )}
      </div>

      <h1 className="page__title">{project.title}</h1>
      {project.summary && <p className="page__sum">{project.summary}</p>}

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
        <section className="sec">
          <h4>프로젝트 개요</h4>
          <div className="md">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {project.description}
            </ReactMarkdown>
          </div>
        </section>
      )}

      <section className="sec">
        <h4>제작 사진</h4>
        <div className="photos">
          {project.images?.length > 0 ? (
            project.images.map((src, i) => (
              <img
                key={src}
                src={resolveAsset(src)}
                alt={`${project.title} ${i + 1}`}
                loading="lazy"
                onClick={() => openPhoto(src)}
              />
            ))
          ) : (
            <>
              <Placeholder label="제작 과정 1" seed={seed + 1} ratio="4/3" />
              <Placeholder label="제작 과정 2" seed={seed + 2} ratio="4/3" />
              <Placeholder label="대회 현장" seed={seed + 3} ratio="4/3" />
            </>
          )}
        </div>
      </section>

      {project.links?.length > 0 && (
        <footer className="page__foot">
          {project.links.map((l) =>
            isGithub(l) ? (
              <a key={l.url} className="ghbtn" href={l.url} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <span>{l.label}</span>
              </a>
            ) : (
              <a key={l.url} className="btn" href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            ),
          )}
        </footer>
      )}

      <Lightbox images={photos} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
    </article>
  );
}
