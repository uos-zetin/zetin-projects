// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('axios');
vi.mock('jwk-to-pem', () => ({ default: () => 'PEM' }));
vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));

import axios from 'axios';
import jwt from 'jsonwebtoken';

import * as verifyModule from './verifyAdmin.js';
async function load() {
  return verifyModule;
}

beforeEach(() => {
  process.env.ADMIN_ID = 'alice,bob';
  axios.get = vi.fn(() => Promise.resolve({ data: [{ kty: 'RSA' }] }));
});
afterEach(() => {
  delete process.env.ADMIN_ID;
  vi.clearAllMocks();
});

describe('verifyAdmin', () => {
  it('토큰이 없으면 401', async () => {
    const { default: verifyAdmin } = await load();
    await expect(verifyAdmin(undefined)).rejects.toMatchObject({ status: 401 });
  });

  it('관리자 username이면 payload를 반환', async () => {
    jwt.verify.mockReturnValue({ username: 'alice' });
    const { default: verifyAdmin } = await load();
    await expect(verifyAdmin('tok')).resolves.toEqual({ username: 'alice' });
  });

  it('허용목록에 없으면 401', async () => {
    jwt.verify.mockReturnValue({ username: 'eve' });
    const { default: verifyAdmin } = await load();
    await expect(verifyAdmin('tok')).rejects.toMatchObject({ status: 401 });
  });
});
