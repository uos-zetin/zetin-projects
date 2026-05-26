import { useMemo, useState } from 'react';
import { useProjects } from './hooks/useProjects.js';
import { getCategories, getYears, getCounts, filterProjects, sortProjects } from './lib/filter.js';
import FilterBar from './components/FilterBar.jsx';
import ProjectGrid from './components/ProjectGrid.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';

export default function App() {
  const { projects, loading, error } = useProjects();
  const [filter, setFilter] = useState({ category: '', year: '', query: '' });
  const [selected, setSelected] = useState(null);

  const categories = useMemo(() => getCategories(projects), [projects]);
  const years = useMemo(() => getYears(projects), [projects]);
  const count = useMemo(() => getCounts(projects), [projects]);
  const visible = useMemo(
    () => sortProjects(filterProjects(projects, filter)),
    [projects, filter],
  );

  const selectedSeed = selected ? projects.findIndex((p) => p.id === selected.id) : 0;

  return (
    <main className="app">
      {loading && <p className="empty">불러오는 중…</p>}
      {error && <p className="empty">프로젝트를 불러오지 못했습니다.</p>}
      {!loading && !error && (
        <>
          <FilterBar
            categories={categories}
            years={years}
            value={filter}
            onChange={setFilter}
            count={count}
          />

          <div className="result">
            <span>
              <b>{visible.length}</b>
              <span style={{ marginLeft: 8 }}>RESULTS</span>
              {filter.category && <span> / {filter.category}</span>}
              {filter.year && <span> / {filter.year}</span>}
            </span>
            <span>SORTED · 최신순</span>
          </div>

          {visible.length === 0 ? (
            <div className="empty">검색 조건과 일치하는 프로젝트가 없습니다.</div>
          ) : (
            <ProjectGrid projects={visible} onSelect={setSelected} />
          )}
        </>
      )}

      <ProjectDetail project={selected} onClose={() => setSelected(null)} seed={selectedSeed} />
    </main>
  );
}
