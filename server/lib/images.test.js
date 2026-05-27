// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

let dir;
beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), 'img-')); process.env.DATA_DIR = dir; });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); delete process.env.DATA_DIR; });

import * as imagesModule from './images.js';
async function load() { return imagesModule; }

describe('processUpload', () => {
  it('이미지를 webp로 변환하고 원본을 보존한다', async () => {
    const { processUpload } = await load();
    const buffer = await sharp({ create: { width: 2000, height: 2000, channels: 3, background: '#f00' } })
      .png().toBuffer();

    const result = await processUpload({ buffer, originalname: 'shot.png', projectId: 'p1' });

    expect(result.path).toBe('data/images/p1/shot.webp');
    const webpAbs = path.join(dir, 'images', 'p1', 'shot.webp');
    const origAbs = path.join(dir, 'images', 'p1', 'originals', 'shot.png');
    expect(existsSync(webpAbs)).toBe(true);
    expect(existsSync(origAbs)).toBe(true);

    const meta = await sharp(webpAbs).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(1600);
  });

  it('svg는 변환하지 않고 원본 경로를 반환한다', async () => {
    const { processUpload } = await load();
    const buffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const result = await processUpload({ buffer, originalname: 'd.svg', projectId: 'p1' });
    expect(result.path).toBe('data/images/p1/d.svg');
  });
});
