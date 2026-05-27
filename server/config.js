import path from 'node:path';

export const getDataDir = () =>
  process.env.DATA_DIR || path.resolve(process.cwd(), 'public', 'data');
export const getProjectsFile = () => path.join(getDataDir(), 'projects.json');
export const getImagesDir = () => path.join(getDataDir(), 'images');
export const getAdminIds = () =>
  (process.env.ADMIN_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
export const getAuthHost = () => process.env.ZETIN_AUTH_HOST || 'auth.zetin.uos.ac.kr';
export const getPort = () => Number(process.env.PORT) || 8000;
