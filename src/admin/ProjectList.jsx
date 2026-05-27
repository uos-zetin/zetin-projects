import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { moveItem } from '../lib/reorder.js';

function Row({ project, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className="admin-row">
      <button type="button" className="admin-row__handle" aria-label="순서 변경 핸들" {...attributes} {...listeners}>⠿</button>
      <span className="admin-row__title">{project.title}</span>
      <button type="button" onClick={() => onEdit(project)}>수정</button>
      <button type="button" onClick={() => { if (window.confirm(`'${project.title}' 삭제할까요?`)) onDelete(project.id); }}>삭제</button>
    </li>
  );
}

export default function ProjectList({ projects, onNew, onEdit, onDelete, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor));
  const ids = projects.map((p) => p.id);

  const onDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    onReorder(moveItem(ids, from, to));
  };

  return (
    <div className="admin-list">
      <div className="admin-list__top">
        <h1>프로젝트 관리</h1>
        <button type="button" onClick={onNew}>새 프로젝트</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="admin-list__items">
            {projects.map((p) => (
              <Row key={p.id} project={p} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
