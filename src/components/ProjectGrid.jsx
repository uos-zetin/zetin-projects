import ProjectCard from './ProjectCard.jsx';

export default function ProjectGrid({ projects = [], onSelect }) {
  if (projects.length === 0) {
    return <p className="project-grid__empty">표시할 프로젝트가 없습니다.</p>;
  }
  return (
    <div className="project-grid">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} onSelect={onSelect} />
      ))}
    </div>
  );
}
