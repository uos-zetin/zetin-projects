# 프로젝트 관리 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 쇼케이스 저장소에 Express 백엔드와 `/admin` 관리 UI를 추가해, ZETIN 계정으로 로그인한 관리자가 프로젝트를 생성·편집·삭제·순서변경하고 이미지를 업로드(자동 WebP 변환+원본 보존)할 수 있게 한다. 데이터는 `data/projects.json` + `data/images/` 파일에 저장한다.

**Architecture:** 한 Express 앱이 React 빌드(`/` 공개, `/admin` 관리)와 `/api`(인증·CRUD·업로드), `/data`(정적 데이터)를 서빙한다. 인증은 newcompetition 패턴(ZETIN auth + `ADMIN_ID` 허용목록 + HttpOnly 쿠키)을 이식한다. 저장은 파일 기반(원자적 쓰기). 표시 순서 = projects.json 배열 순서.

**Tech Stack:** Express, cookie-parser, axios, jsonwebtoken, jwk-to-pem, http-errors, multer, sharp; React + react-router(기존), react-markdown(기존), @dnd-kit(드래그 정렬); Vitest + supertest + @testing-library/react.

**참고 스펙:** `docs/superpowers/specs/2026-05-27-projects-admin-ui-design.md`
**선례 코드:** 서버의 `/srv/server-zetin-competition/repository`(routes/api/admin.js, modules/verifyAdmin.js, middlewares/admin.js) — 인증 패턴 동일.

**범위/제약:**
- 본 계획은 **로컬 개발·테스트**까지. 로그인 검증은 `ZETIN_AUTH_HOST=auth.zetin.uos.ac.kr`(실서버, 읽기 전용)로 테스트. 파일 쓰기는 로컬 `data/`에만.
- **배포(docker-compose·서브도메인·Rhymix 임베드)는 최종 승인 후 Phase 2** — Task 15에서 Dockerfile 작성까지만(실제 배포 X).
- 작업 브랜치: `admin-ui`.

---

## File Structure

```
server/
├── config.js               # 환경변수·경로 헬퍼 (호출 시점에 env 읽음)
├── app.js                  # buildApp(): express 앱 생성(리슨 X, 테스트용)
├── index.js                # app.listen (운영 진입점)
├── lib/
│   ├── store.js            # projects.json 원자적 read/write + CRUD/order
│   └── images.js           # sharp WebP 변환 + 원본 보존
├── modules/verifyAdmin.js  # JWT 검증 + ADMIN_ID (이식)
├── middlewares/admin.js    # admin() 미들웨어 (이식)
└── routes/api/
    ├── admin.js            # signin/signout/status (이식)
    ├── projects.js         # GET / POST / PATCH / DELETE / order
    └── files.js            # POST 업로드
src/
├── lib/filter.js           # sortProjects → 배열 순서 유지로 변경
├── lib/reorder.js          # moveItem 순수 함수
├── App.jsx                 # /admin 라우트(lazy) 추가
└── admin/
    ├── api.js              # 관리자 API 클라이언트
    ├── useAuth.js          # 인증 상태 훅
    ├── AdminApp.jsx        # 관리자 라우트/레이아웃
    ├── LoginForm.jsx
    ├── ProjectList.jsx     # 목록 + 삭제 + 드래그 정렬
    ├── ProjectForm.jsx     # 생성/편집 폼
    ├── MarkdownField.jsx   # textarea + 미리보기
    └── ImageUploadField.jsx
vite.config.js              # dev 프록시(/api,/data → 백엔드) 추가
package.json                # 백엔드 의존성·스크립트
Dockerfile                  # Node 멀티스테이지 (Task 15)
```

각 파일 책임: `store.js`=데이터 영속화만, `images.js`=이미지 변환만, `verifyAdmin`=토큰검증만, 라우트=HTTP 처리만, admin/* 컴포넌트=표시·입력만(상태는 useAuth/폼 로컬).

---

## Task 1: 백엔드 의존성 · 설정 · 앱 스켈레톤

**Files:**
- Modify: `package.json`
- Create: `server/config.js`, `server/app.js`, `server/index.js`
- Modify: `vite.config.js`
- Test: `server/app.test.js`

- [ ] **Step 1: 의존성 설치**

Run:
```bash
npm install express@^4.21.2 cookie-parser@^1.4.7 axios@^1.7.9 jsonwebtoken@^9.0.2 jwk-to-pem@^2.0.7 http-errors@^2.0.0 multer@^1.4.5-lts.1 sharp@^0.33.5
npm install -D supertest@^7.0.0 concurrently@^9.1.0
```
Expected: 설치 성공.

- [ ] **Step 2: `server/config.js` 작성**

```js
import path from 'node:path';

export const getDataDir = () =>
  process.env.DATA_DIR || path.resolve(process.cwd(), 'public', 'data');
export const getProjectsFile = () => path.join(getDataDir(), 'projects.json');
export const getImagesDir = () => path.join(getDataDir(), 'images');
export const getAdminIds = () =>
  (process.env.ADMIN_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
export const getAuthHost = () => process.env.ZETIN_AUTH_HOST || 'auth.zetin.uos.ac.kr';
export const getPort = () => Number(process.env.PORT) || 8000;
```
> dev 기본 DATA_DIR은 `public/data`(Vite가 그대로 서빙). 운영은 Task 15에서 마운트 볼륨으로 오버라이드.

- [ ] **Step 3: `server/app.js` 작성** (라우트는 이후 태스크에서 장착)

```js
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { getDataDir } from './config.js';

export function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // 정적 데이터(projects.json, images) — 운영/개발 공통
  app.use('/data', express.static(getDataDir()));

  return app;
}
```

- [ ] **Step 4: `server/index.js` 작성**

```js
import { buildApp } from './app.js';
import { getPort } from './config.js';

const app = buildApp();
const port = getPort();
app.listen(port, () => console.log(`server listening on ${port}`));
```

- [ ] **Step 5: `vite.config.js`에 dev 프록시 추가**

기존 `defineConfig({...})`의 객체에 `server` 키를 추가한다. 최종 형태:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```
> `/data`는 Vite가 `public/`에서 직접 서빙하므로 프록시 불필요. `/api`만 백엔드로 보낸다.

- [ ] **Step 6: `package.json` 스크립트 추가**

`scripts`에 다음을 추가(기존 키 유지):
```json
    "dev:client": "vite",
    "dev:server": "node --watch server/index.js",
    "dev:full": "concurrently -k \"npm:dev:server\" \"npm:dev:client\"",
    "start": "node server/index.js"
```

- [ ] **Step 7: 실패하는 테스트 작성** `server/app.test.js`

```js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildApp } from './app.js';

describe('app', () => {
  it('GET /api/health 가 ok를 반환한다', async () => {
    const res = await request(buildApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 8: 테스트 실행(통과 확인)**

Run: `npm test -- server/app`
Expected: PASS (health 라우트가 이미 있으므로 통과).

- [ ] **Step 9: 커밋**

```bash
git add package.json package-lock.json vite.config.js server/
git commit -m "feat(server): express app skeleton + config + dev proxy"
```

---

## Task 2: 데이터 저장소 (store.js)

**Files:**
- Create: `server/lib/store.js`
- Test: `server/lib/store.test.js`

- [ ] **Step 1: 실패하는 테스트 작성** `server/lib/store.test.js`

```js
// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

let dir;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'store-'));
  process.env.DATA_DIR = dir;
  writeFileSync(path.join(dir, 'projects.json'), JSON.stringify({ projects: [] }));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  delete process.env.DATA_DIR;
});

import * as storeModule from './store.js';
// store는 호출 시점에 process.env.DATA_DIR를 읽으므로 모듈 캐시를 비울 필요가 없다.
async function load() {
  return storeModule;
}

describe('store', () => {
  it('빈 파일에서 readProjects는 빈 배열', async () => {
    const { readProjects } = await load();
    expect(await readProjects()).toEqual([]);
  });

  it('addProject는 항목을 추가하고 id를 유지한다', async () => {
    const { addProject, readProjects } = await load();
    await addProject({ id: 'a', title: 'A' });
    expect((await readProjects()).map((p) => p.id)).toEqual(['a']);
  });

  it('중복 id 추가는 거부한다', async () => {
    const { addProject } = await load();
    await addProject({ id: 'a', title: 'A' });
    await expect(addProject({ id: 'a', title: 'dup' })).rejects.toThrow();
  });

  it('updateProject는 부분 수정한다', async () => {
    const { addProject, updateProject, readProjects } = await load();
    await addProject({ id: 'a', title: 'A' });
    await updateProject('a', { title: 'B' });
    expect((await readProjects())[0].title).toBe('B');
  });

  it('deleteProject는 제거한다', async () => {
    const { addProject, deleteProject, readProjects } = await load();
    await addProject({ id: 'a', title: 'A' });
    await deleteProject('a');
    expect(await readProjects()).toEqual([]);
  });

  it('reorder는 주어진 id 순서로 재배치한다', async () => {
    const { addProject, reorder, readProjects } = await load();
    await addProject({ id: 'a', title: 'A' });
    await addProject({ id: 'b', title: 'B' });
    await reorder(['b', 'a']);
    expect((await readProjects()).map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('writeProjects는 원자적으로 저장한다(tmp 파일이 남지 않음)', async () => {
    const { writeProjects } = await load();
    await writeProjects([{ id: 'x', title: 'X' }]);
    const saved = JSON.parse(readFileSync(path.join(dir, 'projects.json'), 'utf8'));
    expect(saved.projects[0].id).toBe('x');
    expect(existsSync(path.join(dir, 'projects.json.tmp'))).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- server/lib/store`
Expected: FAIL (store.js 없음).

- [ ] **Step 3: `server/lib/store.js` 구현**

```js
import { promises as fs } from 'node:fs';
import path from 'node:path';
import createError from 'http-errors';
import { getProjectsFile } from '../config.js';

let queue = Promise.resolve(); // 쓰기 직렬화
const serialize = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
};

export async function readProjects() {
  try {
    const raw = await fs.readFile(getProjectsFile(), 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.projects) ? data.projects : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function writeProjects(projects) {
  return serialize(async () => {
    const file = getProjectsFile();
    const tmp = `${file}.tmp`;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(tmp, JSON.stringify({ projects }, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, file); // 원자적 교체
    return projects;
  });
}

export async function addProject(project) {
  if (!project || !project.id) throw createError(400, 'id가 필요합니다.');
  const projects = await readProjects();
  if (projects.some((p) => p.id === project.id)) {
    throw createError(409, `이미 존재하는 id입니다: ${project.id}`);
  }
  return writeProjects([...projects, project]);
}

export async function updateProject(id, patch) {
  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw createError(404, '프로젝트를 찾을 수 없습니다.');
  projects[idx] = { ...projects[idx], ...patch, id }; // id는 변경 불가
  return writeProjects(projects);
}

export async function deleteProject(id) {
  const projects = await readProjects();
  const next = projects.filter((p) => p.id !== id);
  if (next.length === projects.length) throw createError(404, '프로젝트를 찾을 수 없습니다.');
  return writeProjects(next);
}

export async function reorder(ids) {
  const projects = await readProjects();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const next = ids.map((id) => byId.get(id)).filter(Boolean);
  // ids에 없는 기존 항목은 뒤에 보존
  for (const p of projects) if (!ids.includes(p.id)) next.push(p);
  return writeProjects(next);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- server/lib/store`
Expected: PASS (7 tests).

- [ ] **Step 5: 커밋**

```bash
git add server/lib/store.js server/lib/store.test.js
git commit -m "feat(server): file-based project store with atomic writes"
```

---

## Task 3: 관리자 토큰 검증 (verifyAdmin) + 미들웨어

**Files:**
- Create: `server/modules/verifyAdmin.js`, `server/middlewares/admin.js`
- Test: `server/modules/verifyAdmin.test.js`

- [ ] **Step 1: 실패하는 테스트 작성** `server/modules/verifyAdmin.test.js`

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- server/modules/verifyAdmin`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: `server/modules/verifyAdmin.js` 구현**

```js
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
    if (err instanceof jwt.TokenExpiredError) throw createError(401, 'JWT가 만료됐습니다.');
    if (err instanceof jwt.JsonWebTokenError) throw createError(401, 'JWT 검증에 실패했습니다.');
    throw err;
  }
}
```

- [ ] **Step 4: `server/middlewares/admin.js` 구현**

```js
import verifyAdmin from '../modules/verifyAdmin.js';

export default function admin(options = {}) {
  const { adminOnly = true } = options;
  return async (req, res, next) => {
    try {
      await verifyAdmin(req.cookies.adminToken);
      req.isAdmin = true;
      next();
    } catch (err) {
      if (!adminOnly) {
        req.isAdmin = false;
        return next();
      }
      next(err);
    }
  };
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- server/modules/verifyAdmin`
Expected: PASS (3 tests).

- [ ] **Step 6: 커밋**

```bash
git add server/modules/verifyAdmin.js server/middlewares/admin.js server/modules/verifyAdmin.test.js
git commit -m "feat(server): port verifyAdmin + admin middleware (ZETIN auth + ADMIN_ID)"
```

---

## Task 4: 인증 라우트 (admin.js) + 앱 장착

**Files:**
- Create: `server/routes/api/admin.js`
- Modify: `server/app.js`
- Test: `server/routes/api/admin.test.js`

- [ ] **Step 1: 실패하는 테스트 작성** `server/routes/api/admin.test.js`

```js
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

vi.mock('axios');
vi.mock('jwk-to-pem', () => ({ default: () => 'PEM' }));
vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn(() => ({ username: 'alice' })) } }));

import axios from 'axios';
import { buildApp } from '../../app.js';

beforeEach(() => {
  process.env.ADMIN_ID = 'alice';
  axios.get = vi.fn(() => Promise.resolve({ data: [{ kty: 'RSA' }] }));
});
afterEach(() => { delete process.env.ADMIN_ID; vi.clearAllMocks(); });

describe('POST /api/admin/signin', () => {
  it('관리자 로그인 성공 시 쿠키를 설정한다', async () => {
    axios.post = vi.fn(() => Promise.resolve({ data: { status: 'success', token: 'tok' } }));
    const res = await request(buildApp()).post('/api/admin/signin').send({ id: 'alice', pw: 'pw' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join()).toMatch(/adminToken=/);
    expect(res.body.username).toBe('alice');
  });

  it('ZETIN 로그인 실패 시 401', async () => {
    axios.post = vi.fn(() => Promise.resolve({ data: { status: 'fail' } }));
    const res = await request(buildApp()).post('/api/admin/signin').send({ id: 'x', pw: 'y' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- server/routes/api/admin`
Expected: FAIL (signin 404 — 라우트 미장착).

- [ ] **Step 3: `server/routes/api/admin.js` 구현**

```js
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
```

- [ ] **Step 4: `server/app.js`에 라우트와 에러 핸들러 장착**

`buildApp()`의 `app.get('/api/health'...)` 다음 줄에 추가:
```js
  app.use('/api/admin', adminRouter);
```
그리고 `/data` static 등록 **뒤, return 앞**에 에러 핸들러 추가:
```js
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).send(err.message || 'Server Error');
  });
```
파일 상단 import에 추가:
```js
import adminRouter from './routes/api/admin.js';
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- server/routes/api/admin`
Expected: PASS (2 tests).

- [ ] **Step 6: 커밋**

```bash
git add server/routes/api/admin.js server/app.js server/routes/api/admin.test.js
git commit -m "feat(server): admin signin/signout/status routes + error handler"
```

---

## Task 5: 프로젝트 CRUD 라우트 (projects.js)

**Files:**
- Create: `server/routes/api/projects.js`
- Modify: `server/app.js`
- Test: `server/routes/api/projects.test.js`

- [ ] **Step 1: 실패하는 테스트 작성** `server/routes/api/projects.test.js`

```js
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// 인증 미들웨어를 통과(관리자)로 모킹
vi.mock('../../middlewares/admin.js', () => ({
  default: () => (req, res, next) => { req.isAdmin = true; next(); },
}));

import { buildApp } from '../../app.js';

let dir;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'proj-'));
  process.env.DATA_DIR = dir;
  writeFileSync(path.join(dir, 'projects.json'), JSON.stringify({ projects: [] }));
});
afterEach(() => { rmSync(dir, { recursive: true, force: true }); delete process.env.DATA_DIR; });

describe('projects API', () => {
  it('GET은 목록을 반환한다', async () => {
    const res = await request(buildApp()).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST → GET 왕복', async () => {
    const app = buildApp();
    await request(app).post('/api/projects').send({ id: 'a', title: 'A' }).expect(200);
    const res = await request(app).get('/api/projects');
    expect(res.body.map((p) => p.id)).toEqual(['a']);
  });

  it('PATCH는 수정, DELETE는 삭제', async () => {
    const app = buildApp();
    await request(app).post('/api/projects').send({ id: 'a', title: 'A' });
    await request(app).patch('/api/projects/a').send({ title: 'B' }).expect(200);
    let res = await request(app).get('/api/projects');
    expect(res.body[0].title).toBe('B');
    await request(app).delete('/api/projects/a').expect(200);
    res = await request(app).get('/api/projects');
    expect(res.body).toEqual([]);
  });

  it('PUT /order 는 순서를 바꾼다', async () => {
    const app = buildApp();
    await request(app).post('/api/projects').send({ id: 'a', title: 'A' });
    await request(app).post('/api/projects').send({ id: 'b', title: 'B' });
    await request(app).put('/api/projects/order').send({ ids: ['b', 'a'] }).expect(200);
    const res = await request(app).get('/api/projects');
    expect(res.body.map((p) => p.id)).toEqual(['b', 'a']);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- server/routes/api/projects`
Expected: FAIL (라우트 없음).

- [ ] **Step 3: `server/routes/api/projects.js` 구현**

```js
import { Router } from 'express';
import admin from '../../middlewares/admin.js';
import { readProjects, addProject, updateProject, deleteProject, reorder } from '../../lib/store.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await readProjects());
  } catch (err) {
    next(err);
  }
});

router.post('/', admin(), async (req, res, next) => {
  try {
    await addProject(req.body);
    res.json(req.body);
  } catch (err) {
    next(err);
  }
});

router.put('/order', admin(), async (req, res, next) => {
  try {
    await reorder(req.body.ids || []);
    res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', admin(), async (req, res, next) => {
  try {
    await updateProject(req.params.id, req.body);
    res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', admin(), async (req, res, next) => {
  try {
    await deleteProject(req.params.id);
    res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

export default router;
```
> `/order`를 `/:id`보다 먼저 등록해 경로 충돌을 막는다.

- [ ] **Step 4: `server/app.js`에 장착**

import 추가:
```js
import projectsRouter from './routes/api/projects.js';
```
`app.use('/api/admin', adminRouter);` 다음 줄에:
```js
  app.use('/api/projects', projectsRouter);
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- server/routes/api/projects`
Expected: PASS (4 tests).

- [ ] **Step 6: 커밋**

```bash
git add server/routes/api/projects.js server/app.js server/routes/api/projects.test.js
git commit -m "feat(server): project CRUD + reorder routes"
```

---

## Task 6: 이미지 WebP 변환 + 원본 보존 (images.js)

**Files:**
- Create: `server/lib/images.js`
- Test: `server/lib/images.test.js`

- [ ] **Step 1: 실패하는 테스트 작성** `server/lib/images.test.js`

```js
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
    // 2000x2000 빨강 PNG 생성
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
    expect(meta.width).toBeLessThanOrEqual(1600); // 1600px로 축소
  });

  it('svg는 변환하지 않고 원본 경로를 반환한다', async () => {
    const { processUpload } = await load();
    const buffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const result = await processUpload({ buffer, originalname: 'd.svg', projectId: 'p1' });
    expect(result.path).toBe('data/images/p1/d.svg');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- server/lib/images`
Expected: FAIL (images.js 없음).

- [ ] **Step 3: `server/lib/images.js` 구현**

```js
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { getImagesDir } from '../config.js';

const MAX_DIM = 1600;
const QUALITY = 80;
const NO_CONVERT = new Set(['.svg', '.gif']);

// 파일명에서 안전한 베이스명 생성 (확장자 제외)
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

  // WebP 변환(축소 + 품질)
  const webp = await sharp(buffer)
    .rotate()
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  await fs.writeFile(path.join(projDir, `${base}.webp`), webp);
  return { path: `data/images/${projId}/${base}.webp` };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- server/lib/images`
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
git add server/lib/images.js server/lib/images.test.js
git commit -m "feat(server): image WebP conversion (sharp) with original preservation"
```

---

## Task 7: 이미지 업로드 라우트 (files.js)

**Files:**
- Create: `server/routes/api/files.js`
- Modify: `server/app.js`
- Test: `server/routes/api/files.test.js`

- [ ] **Step 1: 실패하는 테스트 작성** `server/routes/api/files.test.js`

```js
// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { vi } from 'vitest';

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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- server/routes/api/files`
Expected: FAIL (라우트 없음).

- [ ] **Step 3: `server/routes/api/files.js` 구현**

```js
import { Router } from 'express';
import multer from 'multer';
import createError from 'http-errors';
import admin from '../../middlewares/admin.js';
import { processUpload } from '../../lib/images.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
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
```

- [ ] **Step 4: `server/app.js`에 장착**

import 추가:
```js
import filesRouter from './routes/api/files.js';
```
`app.use('/api/projects', projectsRouter);` 다음 줄에:
```js
  app.use('/api/files', filesRouter);
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- server/routes/api/files`
Expected: PASS (1 test).

- [ ] **Step 6: 전체 백엔드 테스트 + 커밋**

Run: `npm test -- server`
Expected: 모든 server 테스트 PASS.
```bash
git add server/routes/api/files.js server/app.js server/routes/api/files.test.js
git commit -m "feat(server): image upload route (multer + webp)"
```

---

## Task 8: 공개 정렬을 배열 순서로 변경

**Files:**
- Modify: `src/lib/filter.js`
- Modify: `src/lib/filter.test.js`

- [ ] **Step 1: `sortProjects`를 배열 순서 유지로 변경**

`src/lib/filter.js`의 `sortProjects`를 교체:
```js
export function sortProjects(projects) {
  return [...projects]; // 표시 순서 = 입력(배열) 순서. 정렬은 관리자 드래그로 결정.
}
```
(다른 export `getCategories/getYears/getCounts/filterProjects`는 그대로 유지.)

- [ ] **Step 2: `src/lib/filter.test.js`의 sortProjects 테스트 교체**

기존 `describe('sortProjects', ...)` 블록을 다음으로 교체:
```js
describe('sortProjects', () => {
  it('입력(배열) 순서를 그대로 유지한다', () => {
    expect(sortProjects(sample).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
  it('원본 배열을 변경하지 않는다', () => {
    const copy = [...sample];
    sortProjects(sample);
    expect(sample).toEqual(copy);
  });
});
```

- [ ] **Step 3: 테스트 통과 확인**

Run: `npm test -- src/lib/filter`
Expected: PASS.

- [ ] **Step 4: 커밋**

```bash
git add src/lib/filter.js src/lib/filter.test.js
git commit -m "feat: public list keeps manual (array) order instead of year sort"
```

---

## Task 9: 순서 변경 순수 함수 (reorder.js)

**Files:**
- Create: `src/lib/reorder.js`
- Test: `src/lib/reorder.test.js`

- [ ] **Step 1: 실패하는 테스트 작성** `src/lib/reorder.test.js`

```js
import { describe, it, expect } from 'vitest';
import { moveItem } from './reorder.js';

describe('moveItem', () => {
  it('항목을 앞에서 뒤로 옮긴다', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });
  it('항목을 뒤에서 앞으로 옮긴다', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('원본 배열을 변경하지 않는다', () => {
    const arr = ['a', 'b', 'c'];
    moveItem(arr, 0, 1);
    expect(arr).toEqual(['a', 'b', 'c']);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/lib/reorder`
Expected: FAIL.

- [ ] **Step 3: `src/lib/reorder.js` 구현**

```js
export function moveItem(arr, from, to) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/lib/reorder`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/reorder.js src/lib/reorder.test.js
git commit -m "feat: moveItem pure reorder helper"
```

---

## Task 10: 관리자 API 클라이언트 + 인증 훅

**Files:**
- Create: `src/admin/api.js`, `src/admin/useAuth.js`
- Test: `src/admin/useAuth.test.jsx`

- [ ] **Step 1: `src/admin/api.js` 구현**

```js
const json = (r) => {
  if (!r.ok) return r.text().then((t) => Promise.reject(new Error(t || r.statusText)));
  return r.headers.get('content-type')?.includes('application/json') ? r.json() : r.text();
};
const opt = (method, body) => ({
  method,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: body == null ? undefined : JSON.stringify(body),
});

export const getStatus = () => fetch('/api/admin/status', { credentials: 'include' }).then(json);
export const signin = (id, pw) => fetch('/api/admin/signin', opt('POST', { id, pw })).then(json);
export const signout = () => fetch('/api/admin/signout', opt('POST')).then(json);

export const listProjects = () => fetch('/api/projects', { credentials: 'include' }).then(json);
export const createProject = (p) => fetch('/api/projects', opt('POST', p)).then(json);
export const updateProject = (id, p) => fetch(`/api/projects/${id}`, opt('PATCH', p)).then(json);
export const deleteProject = (id) => fetch(`/api/projects/${id}`, opt('DELETE')).then(json);
export const saveOrder = (ids) => fetch('/api/projects/order', opt('PUT', { ids })).then(json);

export const uploadImage = (projectId, file) => {
  const fd = new FormData();
  fd.set('projectId', projectId);
  fd.set('file', file);
  return fetch('/api/files', { method: 'POST', credentials: 'include', body: fd }).then(json);
};
```

- [ ] **Step 2: 실패하는 테스트 작성** `src/admin/useAuth.test.jsx`

```jsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from './useAuth.js';

beforeEach(() => { vi.restoreAllMocks(); });

describe('useAuth', () => {
  it('마운트 시 status로 로그인 여부를 확인한다', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve({ username: 'alice' }) }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ username: 'alice' });
  });

  it('status 실패 시 비로그인', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, text: () => Promise.resolve('401') }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBe(null);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test -- src/admin/useAuth`
Expected: FAIL (useAuth 없음).

- [ ] **Step 4: `src/admin/useAuth.js` 구현**

```js
import { useEffect, useState, useCallback } from 'react';
import * as api from './api.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return api.getStatus().then(
      (u) => setUser(u),
      () => setUser(null),
    );
  }, []);

  useEffect(() => {
    let alive = true;
    api.getStatus().then(
      (u) => alive && setUser(u),
      () => alive && setUser(null),
    ).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (id, pw) => {
    const u = await api.signin(id, pw);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.signout();
    setUser(null);
  }, []);

  return { user, loading, login, logout, refresh };
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- src/admin/useAuth`
Expected: PASS (2 tests).

- [ ] **Step 6: 커밋**

```bash
git add src/admin/api.js src/admin/useAuth.js src/admin/useAuth.test.jsx
git commit -m "feat(admin): API client + useAuth hook"
```

---

## Task 11: 로그인 폼 (LoginForm)

**Files:**
- Create: `src/admin/LoginForm.jsx`
- Test: `src/admin/LoginForm.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성** `src/admin/LoginForm.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LoginForm from './LoginForm.jsx';

describe('LoginForm', () => {
  it('아이디·비밀번호를 입력하고 제출하면 onLogin을 호출한다', async () => {
    const onLogin = vi.fn(() => Promise.resolve());
    render(<LoginForm onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText('아이디'), 'alice');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(onLogin).toHaveBeenCalledWith('alice', 'pw');
  });

  it('로그인 실패 시 오류 메시지를 보여준다', async () => {
    const onLogin = vi.fn(() => Promise.reject(new Error('관리자가 아닙니다.')));
    render(<LoginForm onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText('아이디'), 'eve');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByText('관리자가 아닙니다.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/admin/LoginForm`
Expected: FAIL.

- [ ] **Step 3: `src/admin/LoginForm.jsx` 구현**

```jsx
import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onLogin(id, pw);
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={submit}>
      <h1>ZETIN 프로젝트 관리자</h1>
      <label>
        아이디
        <input value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
      </label>
      <label>
        비밀번호
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
      </label>
      {error && <p className="admin-login__error">{error}</p>}
      <button type="submit" disabled={busy}>로그인</button>
    </form>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/admin/LoginForm`
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/admin/LoginForm.jsx src/admin/LoginForm.test.jsx
git commit -m "feat(admin): login form"
```

---

## Task 12: 마크다운 입력 필드 + 이미지 업로드 필드

**Files:**
- Create: `src/admin/MarkdownField.jsx`, `src/admin/ImageUploadField.jsx`
- Test: `src/admin/MarkdownField.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성** `src/admin/MarkdownField.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import MarkdownField from './MarkdownField.jsx';

function Harness() {
  const [v, setV] = useState('');
  return <MarkdownField label="개요" value={v} onChange={setV} />;
}

describe('MarkdownField', () => {
  it('입력하면 미리보기에 마크다운이 렌더링된다', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByLabelText('개요'), '**굵게**');
    const preview = screen.getByTestId('md-preview');
    expect(preview.querySelector('strong')).toHaveTextContent('굵게');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/admin/MarkdownField`
Expected: FAIL.

- [ ] **Step 3: `src/admin/MarkdownField.jsx` 구현**

```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function MarkdownField({ label, value, onChange }) {
  return (
    <div className="md-field">
      <label className="md-field__label">
        {label}
        <textarea
          className="md-field__input"
          rows={10}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <div className="md-field__preview md" data-testid="md-preview" aria-label="미리보기">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{value || ''}</ReactMarkdown>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `src/admin/ImageUploadField.jsx` 구현** (단위 테스트는 폼 통합에서 다룸)

```jsx
import { useState } from 'react';
import { uploadImage } from './api.js';
import { resolveAsset } from '../lib/asset.js';

export default function ImageUploadField({ label, projectId, value, multiple = false, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const list = multiple ? (value || []) : value ? [value] : [];

  const onFiles = async (files) => {
    setError('');
    setBusy(true);
    try {
      const paths = [];
      for (const file of files) {
        const { path } = await uploadImage(projectId || 'misc', file);
        paths.push(path);
      }
      onChange(multiple ? [...(value || []), ...paths] : paths[0]);
    } catch (err) {
      setError(err.message || '업로드 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="img-field">
      <span className="img-field__label">{label}</span>
      <div className="img-field__previews">
        {list.map((src) => (
          <img key={src} src={resolveAsset(src)} alt="" />
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        aria-label={label}
        disabled={busy || !projectId}
        onChange={(e) => onFiles([...e.target.files])}
      />
      {!projectId && <small>먼저 ID를 입력하면 업로드할 수 있습니다.</small>}
      {error && <p className="img-field__error">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- src/admin/MarkdownField`
Expected: PASS (1 test).

- [ ] **Step 6: 커밋**

```bash
git add src/admin/MarkdownField.jsx src/admin/ImageUploadField.jsx src/admin/MarkdownField.test.jsx
git commit -m "feat(admin): markdown field with preview + image upload field"
```

---

## Task 13: 프로젝트 편집 폼 (ProjectForm)

**Files:**
- Create: `src/admin/ProjectForm.jsx`
- Test: `src/admin/ProjectForm.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성** `src/admin/ProjectForm.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ProjectForm from './ProjectForm.jsx';

describe('ProjectForm', () => {
  it('새 프로젝트 입력 후 저장하면 onSave에 정규화된 객체를 넘긴다', async () => {
    const onSave = vi.fn(() => Promise.resolve());
    render(<ProjectForm onSave={onSave} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText('ID'), 'new-bot');
    await userEvent.type(screen.getByLabelText('제목'), '새 로봇');
    await userEvent.type(screen.getByLabelText('분류'), '드론');
    await userEvent.type(screen.getByLabelText('연도'), '2026');
    await userEvent.type(screen.getByLabelText('기술 (쉼표로 구분)'), 'ROS, GPU');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 'new-bot', title: '새 로봇', category: '드론', year: 2026, tech: ['ROS', 'GPU'],
    }));
  });

  it('기존 프로젝트는 ID를 수정할 수 없다', () => {
    render(<ProjectForm project={{ id: 'a', title: 'A' }} onSave={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText('ID')).toBeDisabled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/admin/ProjectForm`
Expected: FAIL.

- [ ] **Step 3: `src/admin/ProjectForm.jsx` 구현**

```jsx
import { useState } from 'react';
import MarkdownField from './MarkdownField.jsx';
import ImageUploadField from './ImageUploadField.jsx';

const splitCsv = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);
const joinCsv = (a) => (a || []).join(', ');

export default function ProjectForm({ project, onSave, onCancel }) {
  const isEdit = Boolean(project);
  const [f, setF] = useState({
    id: project?.id || '',
    title: project?.title || '',
    category: project?.category || '',
    year: project?.year ? String(project.year) : '',
    summary: project?.summary || '',
    description: project?.description || '',
    membersCsv: joinCsv(project?.members),
    techCsv: joinCsv(project?.tech),
    thumbnail: project?.thumbnail || '',
    images: project?.images || [],
    featured: project?.featured || false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.id || !f.title) { setError('ID와 제목은 필수입니다.'); return; }
    const payload = {
      id: f.id, title: f.title, category: f.category,
      year: f.year ? Number(f.year) : undefined,
      summary: f.summary, description: f.description,
      members: splitCsv(f.membersCsv), tech: splitCsv(f.techCsv),
      thumbnail: f.thumbnail || undefined, images: f.images,
      links: project?.links || [], featured: f.featured,
    };
    setBusy(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="project-form" onSubmit={submit}>
      <label>ID<input value={f.id} disabled={isEdit} onChange={(e) => set('id')(e.target.value)} /></label>
      <label>제목<input value={f.title} onChange={(e) => set('title')(e.target.value)} /></label>
      <label>분류<input value={f.category} onChange={(e) => set('category')(e.target.value)} /></label>
      <label>연도<input type="number" value={f.year} onChange={(e) => set('year')(e.target.value)} /></label>
      <label>요약<input value={f.summary} onChange={(e) => set('summary')(e.target.value)} /></label>
      <label>부원 (쉼표로 구분)<input value={f.membersCsv} onChange={(e) => set('membersCsv')(e.target.value)} /></label>
      <label>기술 (쉼표로 구분)<input value={f.techCsv} onChange={(e) => set('techCsv')(e.target.value)} /></label>
      <MarkdownField label="개요" value={f.description} onChange={set('description')} />
      <ImageUploadField label="대표 이미지" projectId={f.id} value={f.thumbnail} onChange={set('thumbnail')} />
      <ImageUploadField label="갤러리 이미지" projectId={f.id} value={f.images} multiple onChange={set('images')} />
      <label className="project-form__check">
        <input type="checkbox" checked={f.featured} onChange={(e) => set('featured')(e.target.checked)} />추천
      </label>
      {error && <p className="project-form__error">{error}</p>}
      <div className="project-form__actions">
        <button type="button" onClick={onCancel}>취소</button>
        <button type="submit" disabled={busy}>저장</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/admin/ProjectForm`
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/admin/ProjectForm.jsx src/admin/ProjectForm.test.jsx
git commit -m "feat(admin): project create/edit form"
```

---

## Task 14: 목록·정렬 화면 (ProjectList) + 관리자 앱 조립 + 라우트

**Files:**
- Create: `src/admin/ProjectList.jsx`, `src/admin/AdminApp.jsx`
- Modify: `src/App.jsx`
- Test: `src/admin/ProjectList.test.jsx`, `src/admin/AdminApp.test.jsx`

- [ ] **Step 1: 의존성 설치(드래그 정렬)**

Run: `npm install @dnd-kit/core@^6.3.1 @dnd-kit/sortable@^10.0.0 @dnd-kit/utilities@^3.2.2`
Expected: 설치 성공.

- [ ] **Step 2: 실패하는 테스트 작성** `src/admin/ProjectList.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ProjectList from './ProjectList.jsx';

const projects = [
  { id: 'a', title: '로봇A' },
  { id: 'b', title: '로봇B' },
];

describe('ProjectList', () => {
  it('프로젝트 제목과 새 프로젝트/수정/삭제 컨트롤을 보여준다', () => {
    render(<ProjectList projects={projects} onNew={() => {}} onEdit={() => {}} onDelete={() => {}} onReorder={() => {}} />);
    expect(screen.getByText('로봇A')).toBeInTheDocument();
    expect(screen.getByText('로봇B')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 프로젝트' })).toBeInTheDocument();
  });

  it('삭제 확인 후 onDelete를 호출한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDelete = vi.fn();
    render(<ProjectList projects={projects} onNew={() => {}} onEdit={() => {}} onDelete={onDelete} onReorder={() => {}} />);
    await userEvent.click(screen.getAllByRole('button', { name: '삭제' })[0]);
    expect(onDelete).toHaveBeenCalledWith('a');
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test -- src/admin/ProjectList`
Expected: FAIL.

- [ ] **Step 4: `src/admin/ProjectList.jsx` 구현**

```jsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { moveItem } from '../lib/reorder.js';

function Row({ project, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className="admin-row">
      <button type="button" className="admin-row__handle" aria-label="순서 변경 핸들" {...attributes} {...listeners}>⠿</button>
      <span className="admin-row__title">{project.title}</span>
      <button type="button" onClick={() => onEdit(project)}>수정</button>
      <button type="button" onClick={() => { if (window.confirm(`'${project.title}' 삭제할까요?`)) onDelete(project.id); }}>삭제</button>
    </li>
  );
}

export default function ProjectList({ projects, onNew, onEdit, onDelete, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor));
  const ids = projects.map((p) => p.id);

  const onDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    onReorder(moveItem(ids, from, to));
  };

  return (
    <div className="admin-list">
      <div className="admin-list__top">
        <h1>프로젝트 관리</h1>
        <button type="button" onClick={onNew}>새 프로젝트</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="admin-list__items">
            {projects.map((p) => (
              <Row key={p.id} project={p} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- src/admin/ProjectList`
Expected: PASS (2 tests).

- [ ] **Step 6: `src/admin/AdminApp.jsx` 구현** (로그인 게이트 + 목록/폼 전환 + 저장 연동)

```jsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth.js';
import * as api from './api.js';
import LoginForm from './LoginForm.jsx';
import ProjectList from './ProjectList.jsx';
import ProjectForm from './ProjectForm.jsx';

export default function AdminApp() {
  const { user, loading, login, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null); // null | {} (new) | project

  const reload = useCallback(() => api.listProjects().then(setProjects, () => setProjects([])), []);
  useEffect(() => { if (user) reload(); }, [user, reload]);

  if (loading) return <p className="admin-status">불러오는 중…</p>;
  if (!user) return <LoginForm onLogin={login} />;

  const isNew = editing && !editing.id;
  const save = async (project) => {
    if (isNew) await api.createProject(project);
    else await api.updateProject(project.id, project);
    setEditing(null);
    await reload();
  };
  const remove = async (id) => { await api.deleteProject(id); await reload(); };
  const reorder = async (ids) => { setProjects(ids.map((id) => projects.find((p) => p.id === id))); await api.saveOrder(ids); };

  return (
    <div className="admin">
      <div className="admin__bar">
        <span>{user.username} 님</span>
        <button type="button" onClick={logout}>로그아웃</button>
      </div>
      {editing ? (
        <ProjectForm project={editing.id ? editing : undefined} onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <ProjectList
          projects={projects}
          onNew={() => setEditing({})}
          onEdit={(p) => setEditing(p)}
          onDelete={remove}
          onReorder={reorder}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 7: 실패하는 테스트 작성** `src/admin/AdminApp.test.jsx`

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminApp from './AdminApp.jsx';

beforeEach(() => { vi.restoreAllMocks(); });

describe('AdminApp', () => {
  it('비로그인 시 로그인 폼을 보여준다', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, text: () => Promise.resolve('401') }));
    render(<AdminApp />);
    expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('로그인 상태면 목록을 불러온다', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/status')) {
        return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve({ username: 'alice' }) });
      }
      return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve([{ id: 'a', title: '로봇A' }]) });
    });
    render(<AdminApp />);
    expect(await screen.findByText('로봇A')).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: 테스트 실패 확인 → 통과 확인**

Run: `npm test -- src/admin/AdminApp`
Expected: 먼저 FAIL이 아니라면(이미 구현됨) PASS 2 tests. (AdminApp은 Step 6에서 구현됨.)

- [ ] **Step 9: `src/App.jsx`에 `/admin` 라우트(lazy) 추가**

import에 추가:
```js
import { lazy, Suspense } from 'react';
```
`const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));` 를 App 함수 위에 추가.
`<Routes>` 안에 라우트 추가(공개 라우트와 별도):
```jsx
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<p className="empty">관리자 로딩 중…</p>}>
                <AdminApp />
              </Suspense>
            }
          />
```

- [ ] **Step 10: 전체 테스트 + 빌드 확인**

Run: `npm test`
Expected: 모든 테스트 PASS.
Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 11: 커밋**

```bash
git add package.json package-lock.json src/admin/ProjectList.jsx src/admin/AdminApp.jsx src/admin/ProjectList.test.jsx src/admin/AdminApp.test.jsx src/App.jsx
git commit -m "feat(admin): project list with drag reorder + admin app + /admin route"
```

---

## Task 15: 관리자 스타일 + Dockerfile(Node 전환) + README

**Files:**
- Modify: `src/App.css` (관리자 스타일 추가)
- Modify: `Dockerfile`
- Create: `.dockerignore`(있으면 수정), `README.md` 갱신
- Test: 수동 로컬 구동

- [ ] **Step 1: 관리자 최소 스타일 추가** — `src/App.css` 끝에 추가

```css
/* Admin */
.admin { max-width: 760px; margin: 0 auto; padding: 24px 20px 64px; }
.admin__bar { display: flex; justify-content: flex-end; gap: 12px; align-items: center; color: var(--text-2); font-size: 14px; margin-bottom: 16px; }
.admin-status, .admin-login { max-width: 360px; margin: 64px auto; display: flex; flex-direction: column; gap: 12px; }
.admin-login label, .project-form label, .md-field__label { display: flex; flex-direction: column; gap: 4px; font-size: 14px; color: var(--text-2); }
.admin-login input, .project-form input, .md-field__input { border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; font: inherit; }
.admin-login__error, .project-form__error, .img-field__error { color: #c0392b; font-size: 13px; }
.admin-list__top, .project-form__actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.admin-list__items { list-style: none; padding: 0; margin: 16px 0 0; }
.admin-row { display: flex; align-items: center; gap: 10px; padding: 10px 8px; border-bottom: 1px solid var(--line); }
.admin-row__handle { cursor: grab; border: none; background: none; font-size: 18px; color: var(--text-2); }
.admin-row__title { flex: 1; }
.project-form { display: flex; flex-direction: column; gap: 12px; }
.md-field { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.md-field__preview { border: 1px solid var(--line); border-radius: 6px; padding: 10px; overflow: auto; }
.img-field__previews { display: flex; gap: 8px; flex-wrap: wrap; }
.img-field__previews img { width: 96px; height: 72px; object-fit: cover; border-radius: 6px; background: var(--bg-soft); }
@media (max-width: 600px) { .md-field { grid-template-columns: 1fr; } }
```

- [ ] **Step 2: `Dockerfile`을 Node 멀티스테이지로 교체**

```dockerfile
# build client
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# runtime: express serves built client + api + data
FROM node:20-bookworm-slim AS product
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=builder /app/dist ./dist
ENV DATA_DIR=/app/data
EXPOSE 8000
CMD ["node", "server/index.js"]
```
> `sharp`는 node:20-bookworm-slim에서 prebuilt 바이너리로 설치된다.

- [ ] **Step 3: `server/app.js`에 프로덕션 정적 서빙 추가** (dist + SPA fallback)

`buildApp()`에서 에러 핸들러 **앞**에 추가:
```js
  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/data')) return next();
      res.sendFile(path.join(dist, 'index.html'));
    });
  }
```
(파일 상단에 `import path from 'node:path';`가 이미 있음 — 없으면 추가.)

- [ ] **Step 4: 라우팅을 BrowserRouter로 전환** — `src/App.jsx`

`HashRouter`를 `BrowserRouter`로 교체(import와 사용처 모두). 이유: Node 서버가 SPA fallback을 제공하므로 `/admin` 경로를 일반 URL로 쓸 수 있다. `future` 플래그는 유지.
```js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// ...
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```
그리고 `vite.config.js`의 `base: './'` → `base: '/'`로 변경(절대 경로 라우팅).

- [ ] **Step 5: README 갱신** — `README.md`에 다음 섹션 추가

````markdown
## 관리자 페이지
- 개발: `npm run dev:full` (백엔드 8000 + 프론트 5173, /api 프록시). 관리자: http://localhost:5173/admin
- 환경변수: `ADMIN_ID`(관리자 ZETIN 계정, 콤마 구분), `ZETIN_AUTH_HOST`(기본 auth.zetin.uos.ac.kr), `DATA_DIR`(기본 public/data), `PORT`(기본 8000)
- 운영: `npm run build` 후 `node server/index.js` (Express가 dist + /api + /data 서빙). 배포는 Dockerfile 사용.
````

- [ ] **Step 6: 로컬 통합 검증 (실 인증 서버, 읽기 전용)**

Run:
```bash
ADMIN_ID=<본인ZETIN계정> npm run dev:full
```
- http://localhost:5173/ 공개 쇼케이스 정상
- http://localhost:5173/admin → 로그인 폼 → 본인 ZETIN 계정 로그인 → 목록 표시
- 새 프로젝트 생성 → 이미지 업로드(webp 변환·원본 보존 확인: `public/data/images/<id>/`와 `originals/`) → 마크다운 개요 → 저장 → 공개 페이지 반영
- 드래그로 순서 변경 → 새로고침 후 순서 유지
- 검증 후 서버 종료.

- [ ] **Step 7: 전체 테스트 + 빌드 + 커밋**

Run: `npm test` (전체 PASS), `npm run build` (성공)
```bash
git add -A
git commit -m "feat(admin): styles, Node Dockerfile, prod static serving, BrowserRouter, README"
```

---

## 완료 기준

- [ ] `npm test` 전부 통과(백엔드 + 프론트).
- [ ] `npm run dev:full`로 로그인→CRUD→이미지 업로드(webp+원본)→드래그 정렬→공개 반영 왕복 확인.
- [ ] `npm run build` 성공, `docker build` 성공(선택, Task 15 Dockerfile).
- [ ] 공개 쇼케이스 회귀 없음(기존 테스트 유지).
- [ ] 라이브 서비스(서버 컨테이너/Rhymix/nginx-proxy/DNS) **무변경**.

## Phase 2 (최종 승인 후 — 본 계획 범위 밖)

스펙 9번. 별도로 진행: `docker-compose.yml`(data 볼륨, `ADMIN_ID`·`ZETIN_AUTH_HOST`, zetin-srv 네트워크) 작성·배포, `projects.zetin.uos.ac.kr` 서브도메인+SSL, Rhymix `page`에 공개 URL iframe 임베드(관리 URL은 임베드 안 함), 실제 `ADMIN_ID` 설정.
```
