export default function FilterBar({ categories, years, value, onChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__cats">
        <button
          type="button"
          className={!value.category ? 'is-active' : ''}
          onClick={() => onChange({ ...value, category: '' })}
        >
          전체
        </button>
        {categories.map((c) => (
          <button
            type="button"
            key={c}
            className={value.category === c ? 'is-active' : ''}
            onClick={() => onChange({ ...value, category: c })}
          >
            {c}
          </button>
        ))}
      </div>
      <label className="filter-bar__year">
        연도
        <select
          value={value.year || ''}
          onChange={(e) => onChange({ ...value, year: e.target.value ? Number(e.target.value) : '' })}
        >
          <option value="">전체</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
      <input
        className="filter-bar__search"
        type="search"
        placeholder="검색"
        value={value.query}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
      />
    </div>
  );
}
