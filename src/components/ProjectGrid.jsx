import ProjectCard from './ProjectCard.jsx';

// Renders the project cards in a grid. Empty state is handled by the parent (App).
export default function ProjectGrid({ projects = [], onSelect }) {
  return (
    <div className="grid">
      {projects.map((p, i) => (
        <ProjectCard key={p.id} project={p} index={i} onSelect={onSelect} />
      ))}
    </div>
  );
}
