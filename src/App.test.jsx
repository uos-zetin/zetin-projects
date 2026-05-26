import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App.jsx';

const data = {
  projects: [
    { id: 'a', title: '로봇A', category: 'robot', year: 2024, featured: true, summary: 's', description: 'd', members: ['홍길동'], links: [] },
    { id: 'b', title: '마우스B', category: 'micromouse', year: 2023, featured: false, summary: 's', description: 'd', links: [] },
  ],
};

describe('App', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }));
  });

  it('데이터를 로드해 카드를 보여준다', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: '로봇A' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: '마우스B' })).toBeInTheDocument();
  });

  it('카테고리 필터로 목록을 좁힌다', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: '로봇A' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'micromouse 1' }));
    expect(screen.queryByRole('heading', { name: '로봇A' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '마우스B' })).toBeInTheDocument();
  });

  it('카드를 클릭하면 별도 상세 페이지로 이동한다', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: '로봇A' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /로봇A/ }));
    // 상세 페이지로 전환: 목록 필터바는 사라지고 개요/뒤로가기 링크가 나타난다
    expect(screen.getByRole('link', { name: /목록으로/ })).toBeInTheDocument();
    expect(screen.getByText('프로젝트 개요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'micromouse 1' })).not.toBeInTheDocument();
  });
});
