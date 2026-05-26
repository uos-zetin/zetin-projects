// Category chips (with counts) + year segmented control + search.
export default function FilterBar({ categories, years, value, onChange, count }) {
  return (
    <div className="filters">
      <div className="filters__cats" role="tablist" aria-label="카테고리">
        <button
          type="button"
          className={'chip' + (!value.category ? ' chip--on' : '')}
          onClick={() => onChange({ ...value, category: '' })}
        >
          전체 <span className="chip__n">{count.all}</span>
        </button>
        {categories.map((c) => (
          <button
            type="button"
            key={c}
            className={'chip' + (value.category === c ? ' chip--on' : '')}
            onClick={() => onChange({ ...value, category: c })}
          >
            {c} <span className="chip__n">{count.byCat[c] || 0}</span>
          </button>
        ))}
      </div>
      <div className="filters__right">
        <div className="seg" role="group" aria-label="연도">
          <button
            type="button"
            className={'seg__b' + (!value.year ? ' seg__b--on' : '')}
            onClick={() => onChange({ ...value, year: '' })}
          >
            ALL
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={'seg__b' + (value.year === y ? ' seg__b--on' : '')}
              onClick={() => onChange({ ...value, year: y })}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="search">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="프로젝트, 부원 이름 검색"
            aria-label="검색"
            value={value.query ?? ''}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
