export function getCategories(projects) {
  return [...new Set(projects.map((p) => p.category).filter(Boolean))];
}

export function getYears(projects) {
  return [...new Set(projects.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a);
}

export function getCounts(projects) {
  const byCat = {};
  projects.forEach((p) => {
    if (p.category) byCat[p.category] = (byCat[p.category] || 0) + 1;
  });
  return { all: projects.length, byCat };
}

export function filterProjects(projects, { category, year, query } = {}) {
  return projects.filter((p) => {
    if (category && p.category !== category) return false;
    if (year && p.year !== year) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = [p.title, p.summary, p.category, ...(p.members || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortProjects(projects) {
  return [...projects].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}
