import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth.js';
import * as api from './api.js';
import LoginForm from './LoginForm.jsx';
import ProjectList from './ProjectList.jsx';
import ProjectForm from './ProjectForm.jsx';

export default function AdminApp() {
  const { user, loading, login, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null); // null | {} (new) | project

  const reload = useCallback(() => api.listProjects().then(setProjects, () => setProjects([])), []);
  useEffect(() => { if (user) reload(); }, [user, reload]);

  if (loading) return <p className="admin-status">불러오는 중…</p>;
  if (!user) return <LoginForm onLogin={login} />;

  const isNew = editing && !editing.id;
  const save = async (project) => {
    if (isNew) await api.createProject(project);
    else await api.updateProject(project.id, project);
    setEditing(null);
    await reload();
  };
  const remove = async (id) => { await api.deleteProject(id); await reload(); };
  const reorder = async (ids) => { setProjects(ids.map((id) => projects.find((p) => p.id === id))); await api.saveOrder(ids); };

  return (
    <div className="admin">
      <div className="admin__bar">
        <span>{user.username} 님</span>
        <button type="button" onClick={logout}>로그아웃</button>
      </div>
      {editing ? (
        <ProjectForm project={editing.id ? editing : undefined} onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <ProjectList
          projects={projects}
          onNew={() => setEditing({})}
          onEdit={(p) => setEditing(p)}
          onDelete={remove}
          onReorder={reorder}
        />
      )}
    </div>
  );
}
