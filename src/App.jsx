import { useMemo, useState } from 'react';
import { useProjects } from './hooks/useProjects.js';
import { getCategories, getYears, filterProjects, sortProjects } from './lib/filter.js';
import FilterBar from './components/FilterBar.jsx';
import ProjectGrid from './components/ProjectGrid.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';

export default function App() {
  const { projects, loading, error } = useProjects();
  const [filter, setFilter] = useState({ category: '', year: '', query: '' });
  const [selected, setSelected] = useState(null);

  const categories = useMemo(() => getCategories(projects), [projects]);
  const years = useMemo(() => getYears(projects), [projects]);
  const visible = useMemo(
    () => sortProjects(filterProjects(projects, filter)),
    [projects, filter],
  );

  return (
    <main className="app">
      <header className="app__header">
        <h1>ZETIN 프로젝트</h1>
      </header>
      {loading && <p className="app__status">불러오는 중…</p>}
      {error && <p className="app__status app__status--error">프로젝트를 불러오지 못했습니다.</p>}
      {!loading && !error && (
        <>
          <FilterBar categories={categories} years={years} value={filter} onChange={setFilter} />
          <ProjectGrid projects={visible} onSelect={setSelected} />
        </>
      )}
      <ProjectDetail project={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
