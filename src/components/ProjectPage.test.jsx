import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ProjectPage from './ProjectPage.jsx';

const project = {
  id: 'a', title: '라인트레이서', category: 'robot', year: 2024,
  members: ['홍길동'], description: '본문 설명', tech: ['STM32'],
  links: [{ label: '원본 글 보기', url: 'https://example.com/1' }],
};

function renderAt(path, projects, extra = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/project/:id" element={<ProjectPage projects={projects} {...extra} />} />
        <Route path="/" element={<div>목록 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectPage', () => {
  it('제목/멤버/개요/링크를 별도 페이지로 렌더링한다', () => {
    renderAt('/project/a', [project]);
    expect(screen.getByRole('heading', { name: '라인트레이서' })).toBeInTheDocument();
    expect(screen.getByText(/홍길동/)).toBeInTheDocument();
    expect(screen.getByText('본문 설명')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '원본 글 보기' })).toHaveAttribute('href', 'https://example.com/1');
  });

  it('목록으로 돌아가는 링크를 제공한다', () => {
    renderAt('/project/a', [project]);
    expect(screen.getByRole('link', { name: /목록으로/ })).toBeInTheDocument();
  });

  it('없는 id면 안내와 목록 링크를 보여준다', () => {
    renderAt('/project/zzz', [project]);
    expect(screen.getByText(/찾을 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /목록으로/ })).toBeInTheDocument();
  });
});
