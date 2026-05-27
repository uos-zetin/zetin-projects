import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { getDataDir } from './config.js';
import adminRouter from './routes/api/admin.js';
import projectsRouter from './routes/api/projects.js';
import filesRouter from './routes/api/files.js';

export function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/admin', adminRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/files', filesRouter);

  app.use('/data', express.static(getDataDir()));

  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).send(err.message || 'Server Error');
  });

  return app;
}
