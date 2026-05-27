import { Router } from 'express';
import multer from 'multer';
import createError from 'http-errors';
import admin from '../../middlewares/admin.js';
import { processUpload } from '../../lib/images.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const ALLOWED = /^image\/(jpeg|png|webp|svg\+xml|gif)$/;

const router = Router();

router.post('/', admin(), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw createError(400, '파일이 없습니다.');
    if (!ALLOWED.test(req.file.mimetype)) throw createError(415, '지원하지 않는 이미지 형식입니다.');
    const result = await processUpload({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      projectId: req.body.projectId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
