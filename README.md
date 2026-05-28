# zetin-projects — ZETIN 프로젝트 쇼케이스

서울시립대학교 로봇연구회 **ZETIN**의 프로젝트(로봇 작품) 소개 사이트입니다.
공개 쇼케이스는 ZETIN 홈페이지(Rhymix)에 iframe으로 임베드되며, 관리자 페이지에서 프로젝트를 직접 관리합니다.

- 공개: <https://projects.zetin.uos.ac.kr>
- 관리자: <https://projects.zetin.uos.ac.kr/admin> (ZETIN 계정 로그인)

## 기능

- **공개 쇼케이스(보기 전용)**: 카드 그리드, 카테고리·연도·검색 필터, 카드 클릭 시 별도 상세 페이지, 사진 라이트박스(좌우 넘김·키보드), 마크다운 개요, GitHub 등 링크 버튼
- **관리자 페이지**: ZETIN 계정 로그인(관리자 허용목록만), 프로젝트 생성·수정·삭제, **드래그로 순서 변경**, 이미지 업로드(**WebP 자동 변환 + 원본 보존**), 링크(label·url) 편집, 마크다운 편집기 + 실시간 미리보기

## 아키텍처

Vite + React(프론트엔드)와 Express(백엔드)로 구성된 풀스택 앱. 한 컨테이너의 Express가 React 빌드(`/` 공개, `/admin` 관리)와 API(`/api`), 데이터(`/data`)를 함께 서빙합니다.

- **데이터는 DB 없이 파일 기반**: `data/projects.json`(프로젝트 목록) + `data/images/`(프로젝트별 `.webp` + `originals/` 원본). 표시 순서 = JSON 배열 순서(관리자 드래그가 기록).
- **인증**: ZETIN `server-auth`(`auth.zetin.uos.ac.kr`) 재사용 + `ADMIN_ID` 허용목록 + HttpOnly 쿠키 (newcompetition과 동일 패턴).
- **임베드**: iframe-resizer(자식 contentWindow 내장)로 임베드 높이 자동 조절.
- 라우팅은 `BrowserRouter`, 운영 시 Express가 SPA fallback 제공.

## 기술 스택

- 프론트: Vite, React 18, react-router-dom 6, react-markdown(+remark-gfm/remark-breaks), @dnd-kit
- 백엔드: Express, multer, sharp(이미지 WebP), jsonwebtoken·jwk-to-pem·axios(ZETIN 인증)
- 테스트: Vitest + @testing-library/react + supertest

## 디렉토리 구조

```
src/                  # 프론트엔드
  ├ main.jsx, App.jsx (라우팅: / 공개, /admin 관리[lazy])
  ├ components/       # 공개: ProjectGrid·ProjectCard·ProjectPage·Lightbox·FilterBar·Placeholder
  ├ admin/            # 관리자: AdminApp·LoginForm·ProjectForm·ProjectList·MarkdownField·ImageUploadField·api·useAuth
  └ lib/              # filter·reorder·asset
server/               # 백엔드
  ├ app.js·index.js·config.js
  ├ routes/api/       # admin(인증)·projects(CRUD)·files(업로드)
  ├ lib/              # store(원자적 파일 저장)·images(WebP 변환)
  ├ modules/verifyAdmin.js·middlewares/admin.js
public/data/          # 콘텐츠(개발 기본 DATA_DIR): projects.json + images/  → 편집 가이드: public/data/README.md
docs/superpowers/     # 설계(specs)·구현 계획(plans)
Dockerfile            # 멀티스테이지: node 빌드 → Express 서빙
```

## 개발

```sh
npm install
npm run dev:full   # 백엔드(8000) + 프론트(5173, /api 프록시) 동시 실행
                   #   공개 http://localhost:5173/ , 관리자 http://localhost:5173/admin
npm run dev        # 프론트만 (5173)
npm test           # 전체 테스트 (프론트 + 백엔드)
npm run build      # 프로덕션 빌드 → dist/
npm start          # 프로덕션 서버 (Express): node server/index.js
```

관리자 로그인까지 테스트하려면 `ADMIN_ID`를 지정해 실행 (실제 ZETIN 인증 서버로 계정 검증):
```sh
ADMIN_ID="zetin,tjdgh2626" npm run dev:full
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `ADMIN_ID` | (없음) | 관리자 ZETIN 계정, 콤마 구분 (예: `zetin,tjdgh2626`) |
| `ZETIN_AUTH_HOST` | `auth.zetin.uos.ac.kr` | 인증 서버 호스트 |
| `DATA_DIR` | dev `public/data`, prod `/app/data` | `projects.json`·`images/` 위치 |
| `PORT` | `8000` | 서버 포트 |
| `NODE_ENV` | | `production`이면 Express가 `dist` 정적 서빙 + SPA fallback |

## 콘텐츠 관리

- **권장**: 관리자 페이지(`/admin`)에서 ZETIN 계정 로그인 후 GUI로 생성·수정·삭제·순서변경·이미지/링크 편집.
- **직접 편집**: `public/data/projects.json` 수정 + `images/`에 사진 추가. 필드 스키마와 작성법은 **[`public/data/README.md`](public/data/README.md)** 참고. 개요(`description`)는 마크다운 지원.

## API

| 메서드 · 경로 | 권한 | 설명 |
|---|---|---|
| `GET /api/projects` | 공개 | 프로젝트 목록 |
| `POST /api/projects` | 🔒 | 생성 |
| `PATCH /api/projects/:id` | 🔒 | 수정 |
| `DELETE /api/projects/:id` | 🔒 | 삭제 |
| `PUT /api/projects/order` | 🔒 | 순서 변경 |
| `POST /api/files` | 🔒 | 이미지 업로드 (WebP 변환 + 원본 보존) |
| `GET /api/admin/status`, `POST /api/admin/signin`, `POST /api/admin/signout` | — | ZETIN 인증 |

🔒 = `adminToken` 쿠키 + `ADMIN_ID` 허용목록 검증 필요.

## 배포

멀티스테이지 `Dockerfile`(node 빌드 → Express 서빙)로 이미지를 만들어 운영합니다. 서버에서는 `/srv/server-zetin-projects`에서 docker compose로 구동하며 `data/`를 볼륨 마운트합니다.

- **서버 운용·배포 상세**: `/srv/server-zetin-projects/README.md` 참고
- **코드 갱신 재배포(서버)**: `cd /srv/server-zetin-projects && git -C repository pull && docker compose up -d --build`
- **Rhymix 임베드**(공개 페이지에 붙이는 코드):
  ```html
  <iframe onload="iFrameResize({ heightCalculationMethod: 'lowestElement', bodyMargin: '0 0 24px 0' })" src="https://projects.zetin.uos.ac.kr/" style="min-width:100%; border:0;"></iframe>
  ```
  - 높이는 iframe-resizer로 자동 조절된다. 앱에도 `useIframeAutoHeight` 훅이 있어 내용이 비동기로 채워지면 부모에 높이를 다시 알린다.
  - ⚠️ **Rhymix에 "모바일 전용 레이아웃"이 켜져 있으면** 그 레이아웃엔 iframe-resizer 라이브러리(`zetin-layout`의 `iframeResizer.min.js`)가 없어 모바일에서 임베드 높이가 안 맞을 수 있다 → 모바일에서도 PC(`zetin-layout`)를 쓰도록 **모바일 레이아웃을 비활성**할 것.
  - 편집은 임베드 안이 아니라 `/admin`으로 직접 접속해서 한다.

## 문서

- 설계 문서: `docs/superpowers/specs/`
- 구현 계획: `docs/superpowers/plans/`
