import { describe, it, expect } from 'vitest';
import { getCategories, getYears, filterProjects, sortProjects } from './filter.js';

const sample = [
  { id: 'a', category: 'robot', year: 2024, featured: true, title: '로봇', summary: '빠름' },
  { id: 'b', category: 'micromouse', year: 2023, featured: false, title: '마우스', summary: '미로' },
  { id: 'c', category: 'robot', year: 2022, featured: false, title: '구형', summary: '느림' },
];

describe('getCategories', () => {
  it('중복 없는 카테고리 목록을 반환한다', () => {
    expect(getCategories(sample).sort()).toEqual(['micromouse', 'robot']);
  });
});

describe('getYears', () => {
  it('내림차순 연도 목록을 반환한다', () => {
    expect(getYears(sample)).toEqual([2024, 2023, 2022]);
  });
});

describe('filterProjects', () => {
  it('카테고리로 필터링한다', () => {
    expect(filterProjects(sample, { category: 'robot' }).map((p) => p.id)).toEqual(['a', 'c']);
  });
  it('연도로 필터링한다', () => {
    expect(filterProjects(sample, { year: 2023 }).map((p) => p.id)).toEqual(['b']);
  });
  it('검색어(title/summary)로 필터링한다', () => {
    expect(filterProjects(sample, { query: '미로' }).map((p) => p.id)).toEqual(['b']);
  });
  it('필터 없으면 전체 반환', () => {
    expect(filterProjects(sample, {}).length).toBe(3);
  });
});

describe('sortProjects', () => {
  it('featured 먼저, 그다음 연도 내림차순', () => {
    expect(sortProjects(sample).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
});
