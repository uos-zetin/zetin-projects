import jwt from 'jsonwebtoken';
import axios from 'axios';
import jwkToPem from 'jwk-to-pem';
import createError from 'http-errors';
import { getAdminIds, getAuthHost } from '../config.js';

export default async function verifyAdmin(token) {
  if (!token) throw createError(401, '인증 정보가 없습니다.');
  const adminIds = getAdminIds();
  if (adminIds.length === 0) throw createError(500, '관리자(ADMIN_ID) 설정이 없습니다.');

  try {
    const resKeys = await axios.get(`https://${getAuthHost()}/keys`);
    const publicKey = jwkToPem(resKeys.data[0]);
    const payload = jwt.verify(token, publicKey);
    if (adminIds.includes(payload.username)) return payload;
    throw createError(401, '해당 계정은 관리자가 아닙니다.');
  } catch (err) {
    if (jwt.TokenExpiredError && err instanceof jwt.TokenExpiredError)
      throw createError(401, 'JWT가 만료됐습니다.');
    if (jwt.JsonWebTokenError && err instanceof jwt.JsonWebTokenError)
      throw createError(401, 'JWT 검증에 실패했습니다.');
    throw err;
  }
}
