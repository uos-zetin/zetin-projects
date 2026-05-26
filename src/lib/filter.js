export function getCategories(projects) {
  return [...new Set(projects.map((p) => p.category).filter(Boolean))];
}

export function getYears(projects) {
  return [...new Set(projects.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a);
}

export function filterProjects(projects, { category, year, query } = {}) {
  return projects.filter((p) => {
    if (category && p.category !== category) return false;
    if (year && p.year !== year) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${p.title ?? ''} ${p.summary ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortProjects(projects) {
  return [...projects].sort((a, b) => {
    if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
    return (b.year ?? 0) - (a.year ?? 0);
  });
}
