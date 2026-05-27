// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

vi.mock('../../middlewares/admin.js', () => ({
  default: () => (req, res, next) => { req.isAdmin = true; next(); },
}));

import { buildApp } from '../../app.js';

let dir;
beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), 'files-')); process.env.DATA_DIR = dir; });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); delete process.env.DATA_DIR; });

describe('POST /api/files', () => {
  it('이미지를 업로드하면 webp 경로를 반환한다', async () => {
    const png = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#0a0' } })
      .png().toBuffer();
    const res = await request(buildApp())
      .post('/api/files')
      .field('projectId', 'p1')
      .attach('file', png, 'photo.png');
    expect(res.status).toBe(200);
    expect(res.body.path).toBe('data/images/p1/photo.webp');
  });
});
