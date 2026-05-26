import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getYears, getCounts, filterProjects, sortProjects } from '../lib/filter.js';
import FilterBar from './FilterBar.jsx';
import ProjectGrid from './ProjectGrid.jsx';

// Project list page: filter bar + result summary + grid. Selecting a card navigates to its page.
export default function ListView({ projects, loading, error, filter, onFilterChange }) {
  const navigate = useNavigate();

  const categories = useMemo(() => getCategories(projects), [projects]);
  const years = useMemo(() => getYears(projects), [projects]);
  const count = useMemo(() => getCounts(projects), [projects]);
  const visible = useMemo(
    () => sortProjects(filterProjects(projects, filter)),
    [projects, filter],
  );

  if (loading) return <p className="empty">불러오는 중…</p>;
  if (error) return <p className="empty">프로젝트를 불러오지 못했습니다.</p>;

  return (
    <>
      <FilterBar
        categories={categories}
        years={years}
        value={filter}
        onChange={onFilterChange}
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
        <ProjectGrid projects={visible} onSelect={(p) => navigate(`/project/${p.id}`)} />
      )}
    </>
  );
}
