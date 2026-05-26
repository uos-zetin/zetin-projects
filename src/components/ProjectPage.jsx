import { useParams, Link } from 'react-router-dom';
import Placeholder from './Placeholder.jsx';
import { resolveAsset } from '../lib/asset.js';

const isGithub = (link) => /github/i.test(link.url || '') || /github/i.test(link.label || '');

// Full detail page (classic navigation). Reached at /#/project/:id.
export default function ProjectPage({ projects, loading, error }) {
  const { id } = useParams();

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

  return (
    <article className="page">
      <div className="page__top">
        <Link className="page__back" to="/">← 목록으로</Link>
        <span className="page__crumb">ZETIN / {project.category} / {project.year}</span>
      </div>

      <div className="page__hero">
        {heroSrc ? (
          <img className="page__heroimg" src={resolveAsset(heroSrc)} alt={project.title} />
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
          <p>{project.description}</p>
        </section>
      )}

      <section className="sec">
        <h4>제작 사진</h4>
        <div className="photos">
          {project.images?.length > 0 ? (
            project.images.map((src, i) => (
              <img key={src} src={resolveAsset(src)} alt={`${project.title} ${i + 1}`} loading="lazy" />
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
    </article>
  );
}
