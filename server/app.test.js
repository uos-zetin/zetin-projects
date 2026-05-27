// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildApp } from './app.js';

describe('app', () => {
  it('GET /api/health 가 ok를 반환한다', async () => {
    const res = await request(buildApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
