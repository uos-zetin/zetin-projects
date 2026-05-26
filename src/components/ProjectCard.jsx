import Placeholder from './Placeholder.jsx';

// Editorial grid card: striped thumb + monospace index/category/year row + title + summary.
export default function ProjectCard({ project, index = 0, onSelect }) {
  const idx = String(index + 1).padStart(2, '0');
  return (
    <button type="button" className="card" onClick={() => onSelect(project)}>
      <div className="card__thumb">
        <Placeholder label={project.title} seed={index} ratio="4/3" />
        {project.featured && <span className="card__flag">FEATURED</span>}
      </div>
      <div className="card__body">
        <div className="card__row">
          <span className="card__idx">{idx}</span>
          {project.category && <span className="card__cat">{project.category}</span>}
          <span className="card__year">{project.year}</span>
        </div>
        <h3 className="card__title">{project.title}</h3>
        <p className="card__sum">{project.summary}</p>
      </div>
    </button>
  );
}
