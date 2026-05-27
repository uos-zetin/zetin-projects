import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { getDataDir } from './config.js';

export function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/data', express.static(getDataDir()));

  return app;
}
