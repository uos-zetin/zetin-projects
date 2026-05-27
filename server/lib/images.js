import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { getImagesDir } from '../config.js';

const MAX_DIM = 1600;
const QUALITY = 80;
const NO_CONVERT = new Set(['.svg', '.gif']);

function safeBase(name) {
  return path.basename(name, path.extname(name)).replace(/[^\w.-]/g, '_') || 'image';
}

export async function processUpload({ buffer, originalname, projectId }) {
  const projId = String(projectId || 'misc').replace(/[^\w-]/g, '_');
  const ext = path.extname(originalname).toLowerCase();
  const base = safeBase(originalname);
  const projDir = path.join(getImagesDir(), projId);
  const origDir = path.join(projDir, 'originals');
  await fs.mkdir(origDir, { recursive: true });

  // 원본 보존
  await fs.writeFile(path.join(origDir, `${base}${ext}`), buffer);

  // 변환 부적합 형식: 원본을 그대로 표시본으로도 둠
  if (NO_CONVERT.has(ext)) {
    await fs.writeFile(path.join(projDir, `${base}${ext}`), buffer);
    return { path: `data/images/${projId}/${base}${ext}` };
  }

  const webp = await sharp(buffer)
    .rotate()
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  await fs.writeFile(path.join(projDir, `${base}.webp`), webp);
  return { path: `data/images/${projId}/${base}.webp` };
}
