import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App.jsx';

const data = {
  projects: [
    { id: 'a', title: '로봇A', category: 'robot', year: 2024, featured: true, summary: 's', description: 'd', links: [] },
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

  it('카드를 클릭하면 상세 드로어가 열린다', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: '로봇A' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /로봇A/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
