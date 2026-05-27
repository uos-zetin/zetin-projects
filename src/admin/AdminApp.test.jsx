import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminApp from './AdminApp.jsx';

beforeEach(() => { vi.restoreAllMocks(); });

describe('AdminApp', () => {
  it('비로그인 시 로그인 폼을 보여준다', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, text: () => Promise.resolve('401') }));
    render(<AdminApp />);
    expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('로그인 상태면 목록을 불러온다', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/status')) {
        return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve({ username: 'alice' }) });
      }
      return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve([{ id: 'a', title: '로봇A' }]) });
    });
    render(<AdminApp />);
    expect(await screen.findByText('로봇A')).toBeInTheDocument();
  });
});
