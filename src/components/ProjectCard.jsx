export default function ProjectCard({ project, onSelect }) {
  return (
    <button type="button" className="project-card" onClick={() => onSelect(project)}>
      {project.thumbnail && (
        <img className="project-card__thumb" src={project.thumbnail} alt="" loading="lazy" />
      )}
      <div className="project-card__body">
        <h3 className="project-card__title">{project.title}</h3>
        <div className="project-card__meta">
          <span className="project-card__year">{project.year}</span>
          {project.category && <span className="project-card__cat">{project.category}</span>}
        </div>
        <p className="project-card__summary">{project.summary}</p>
      </div>
    </button>
  );
}
