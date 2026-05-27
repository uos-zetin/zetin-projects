// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

vi.mock('axios');
vi.mock('jwk-to-pem', () => ({ default: () => 'PEM' }));
vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn(() => ({ username: 'alice' })) } }));

import axios from 'axios';
import { buildApp } from '../../app.js';

beforeEach(() => {
  process.env.ADMIN_ID = 'alice';
  axios.get = vi.fn(() => Promise.resolve({ data: [{ kty: 'RSA' }] }));
});
afterEach(() => { delete process.env.ADMIN_ID; vi.clearAllMocks(); });

describe('POST /api/admin/signin', () => {
  it('관리자 로그인 성공 시 쿠키를 설정한다', async () => {
    axios.post = vi.fn(() => Promise.resolve({ data: { status: 'success', token: 'tok' } }));
    const res = await request(buildApp()).post('/api/admin/signin').send({ id: 'alice', pw: 'pw' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join()).toMatch(/adminToken=/);
    expect(res.body.username).toBe('alice');
  });

  it('ZETIN 로그인 실패 시 401', async () => {
    axios.post = vi.fn(() => Promise.resolve({ data: { status: 'fail' } }));
    const res = await request(buildApp()).post('/api/admin/signin').send({ id: 'x', pw: 'y' });
    expect(res.status).toBe(401);
  });
});
