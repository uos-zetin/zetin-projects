import { Router } from 'express';
import axios from 'axios';
import createError from 'http-errors';
import verifyAdmin from '../../modules/verifyAdmin.js';
import { getAuthHost } from '../../config.js';

const router = Router();
const COOKIE_NAME = 'adminToken';
const COOKIE_PATH = '/api';

router.get('/status', async (req, res, next) => {
  try {
    res.send(await verifyAdmin(req.cookies[COOKIE_NAME]));
  } catch (err) {
    next(err);
  }
});

router.post('/signin', async (req, res, next) => {
  try {
    const { id, pw } = req.body;
    const resLogin = await axios.post(`https://${getAuthHost()}/auth`, { id, pw });
    const { status, token } = resLogin.data;
    if (status !== 'success') {
      throw createError(401, 'ZETIN 로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    }
    const payload = await verifyAdmin(token);
    res.cookie(COOKIE_NAME, token, { httpOnly: true, path: COOKIE_PATH, sameSite: 'lax' }).send(payload);
  } catch (err) {
    next(err);
  }
});

router.post('/signout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: COOKIE_PATH }).send({ status: 'success' });
});

export default router;
