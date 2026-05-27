// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

let dir;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'store-'));
  process.env.DATA_DIR = dir;
  writeFileSync(path.join(dir, 'projects.json'), JSON.stringify({ projects: [] }));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  delete process.env.DATA_DIR;
});

import * as storeModule from './store.js';
// store는 호출 시점에 process.env.DATA_DIR를 읽으므로 모듈 캐시를 비울 필요가 없다.
async function load() {
  return storeModule;
}

describe('store', () => {
  it('빈 파일에서 readProjects는 빈 배열', async () => {
    const { readProjects } = await load();
    expect(await readProjects()).toEqual([]);
  });

  it('addProject는 항목을 추가하고 id를 유지한다', async () => {
    const { addProject, readProjects } = await load();
    await addProject({ id: 'a', title: 'A' });
    expect((await readProjects()).map((p) => p.id)).toEqual(['a']);
  });

  it('중복 id 추가는 거부한다', async () => {
    const { addProject } = await load();
    await addProject({ id: 'a', title: 'A' });
    await expect(addProject({ id: 'a', title: 'dup' })).rejects.toThrow();
  });

  it('updateProject는 부분 수정한다', async () => {
    const { addProject, updateProject, readProjects } = await load();
    await addProject({ id: 'a', title: 'A' });
    await updateProject('a', { title: 'B' });
    expect((await readProjects())[0].title).toBe('B');
  });

  it('deleteProject는 제거한다', async () => {
    const { addProject, deleteProject, readProjects } = await load();
    await addProject({ id: 'a', title: 'A' });
    await deleteProject('a');
    expect(await readProjects()).toEqual([]);
  });

  it('reorder는 주어진 id 순서로 재배치한다', async () => {
    const { addProject, reorder, readProjects } = await load();
    await addProject({ id: 'a', title: 'A' });
    await addProject({ id: 'b', title: 'B' });
    await reorder(['b', 'a']);
    expect((await readProjects()).map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('writeProjects는 원자적으로 저장한다(tmp 파일이 남지 않음)', async () => {
    const { writeProjects } = await load();
    await writeProjects([{ id: 'x', title: 'X' }]);
    const saved = JSON.parse(readFileSync(path.join(dir, 'projects.json'), 'utf8'));
    expect(saved.projects[0].id).toBe('x');
    expect(existsSync(path.join(dir, 'projects.json.tmp'))).toBe(false);
  });
});
