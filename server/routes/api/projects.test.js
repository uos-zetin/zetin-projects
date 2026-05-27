// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// 인증 미들웨어를 통과(관리자)로 모킹
vi.mock('../../middlewares/admin.js', () => ({
  default: () => (req, res, next) => { req.isAdmin = true; next(); },
}));

import { buildApp } from '../../app.js';

let dir;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'proj-'));
  process.env.DATA_DIR = dir;
  writeFileSync(path.join(dir, 'projects.json'), JSON.stringify({ projects: [] }));
});
afterEach(() => { rmSync(dir, { recursive: true, force: true }); delete process.env.DATA_DIR; });

describe('projects API', () => {
  it('GET은 목록을 반환한다', async () => {
    const res = await request(buildApp()).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST → GET 왕복', async () => {
    const app = buildApp();
    await request(app).post('/api/projects').send({ id: 'a', title: 'A' }).expect(200);
    const res = await request(app).get('/api/projects');
    expect(res.body.map((p) => p.id)).toEqual(['a']);
  });

  it('PATCH는 수정, DELETE는 삭제', async () => {
    const app = buildApp();
    await request(app).post('/api/projects').send({ id: 'a', title: 'A' });
    await request(app).patch('/api/projects/a').send({ title: 'B' }).expect(200);
    let res = await request(app).get('/api/projects');
    expect(res.body[0].title).toBe('B');
    await request(app).delete('/api/projects/a').expect(200);
    res = await request(app).get('/api/projects');
    expect(res.body).toEqual([]);
  });

  it('PUT /order 는 순서를 바꾼다', async () => {
    const app = buildApp();
    await request(app).post('/api/projects').send({ id: 'a', title: 'A' });
    await request(app).post('/api/projects').send({ id: 'b', title: 'B' });
    await request(app).put('/api/projects/order').send({ ids: ['b', 'a'] }).expect(200);
    const res = await request(app).get('/api/projects');
    expect(res.body.map((p) => p.id)).toEqual(['b', 'a']);
  });
});
