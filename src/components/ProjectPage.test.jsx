import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('GitHub 링크는 아이콘 버튼으로 렌더링한다', () => {
    const withGh = { ...project, links: [{ label: 'GitHub', url: 'https://github.com/uos-zetin/x' }] };
    renderAt('/project/a', [withGh]);
    const gh = screen.getByRole('link', { name: 'GitHub' });
    expect(gh).toHaveClass('ghbtn');
    expect(gh.querySelector('svg')).toBeInTheDocument();
  });

  it('프로젝트 개요는 마크다운을 렌더링한다', () => {
    renderAt('/project/a', [{ ...project, description: '**굵게** 그리고 일반 텍스트' }]);
    const strong = screen.getByText('굵게');
    expect(strong.tagName).toBe('STRONG');
  });

  it('사진을 클릭하면 라이트박스로 크게 보이고 다음으로 넘길 수 있다', async () => {
    const withPhotos = {
      ...project,
      thumbnail: 'data/images/a.png',
      images: ['data/images/b.png', 'data/images/c.png'],
    };
    renderAt('/project/a', [withPhotos]);

    const galleryB = screen.getAllByRole('img').find((i) => /b\.png/.test(i.getAttribute('src')));
    await userEvent.click(galleryB);

    const dialog = screen.getByRole('dialog', { name: '사진 크게 보기' });
    expect(within(dialog).getByRole('img').getAttribute('src')).toMatch(/b\.png/);

    await userEvent.click(within(dialog).getByRole('button', { name: '다음' }));
    expect(within(dialog).getByRole('img').getAttribute('src')).toMatch(/c\.png/);
  });

  it('없는 id면 안내와 목록 링크를 보여준다', () => {
    renderAt('/project/zzz', [project]);
    expect(screen.getByText(/찾을 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /목록으로/ })).toBeInTheDocument();
  });
});
