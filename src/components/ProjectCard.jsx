import Placeholder from './Placeholder.jsx';
import { resolveAsset } from '../lib/asset.js';

// Simple card: thumbnail (real photo or plain placeholder) + title + category·year + summary.
export default function ProjectCard({ project, onSelect }) {
  return (
    <button type="button" className="card" onClick={() => onSelect(project)}>
      <div className="card__thumb">
        {project.thumbnail ? (
          <img className="card__img" src={resolveAsset(project.thumbnail)} alt={project.title} loading="lazy" />
        ) : (
          <Placeholder label={project.title} ratio="4/3" />
        )}
      </div>
      <div className="card__body">
        <h3 className="card__title">{project.title}</h3>
        <p className="card__meta">
          {project.category && <span>{project.category}</span>}
          {project.category && project.year ? ' · ' : ''}
          {project.year && <span>{project.year}</span>}
        </p>
        <p className="card__sum">{project.summary}</p>
      </div>
    </button>
  );
}
