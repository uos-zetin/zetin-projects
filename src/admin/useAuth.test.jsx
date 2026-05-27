import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from './useAuth.js';

beforeEach(() => { vi.restoreAllMocks(); });

describe('useAuth', () => {
  it('마운트 시 status로 로그인 여부를 확인한다', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve({ username: 'alice' }) }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ username: 'alice' });
  });

  it('status 실패 시 비로그인', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, text: () => Promise.resolve('401') }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBe(null);
  });
});
