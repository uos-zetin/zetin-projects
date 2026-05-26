import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjects } from './useProjects.js';

describe('useProjects', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ projects: [{ id: 'a', title: 'A' }] }),
      }),
    );
  });

  it('로딩 후 projects 배열을 반환한다', async () => {
    const { result } = renderHook(() => useProjects());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projects).toEqual([{ id: 'a', title: 'A' }]);
    expect(result.current.error).toBe(null);
  });

  it('fetch 실패 시 error를 설정한다', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404 }));
    const { result } = renderHook(() => useProjects());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.projects).toEqual([]);
  });
});
