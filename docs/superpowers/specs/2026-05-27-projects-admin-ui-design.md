# ZETIN 프로젝트 관리 UI — 설계 문서

- 작성일: 2026-05-27
- 저장소: `uos-zetin/zetin-projects` (현재 정적 Vite+React 쇼케이스)
- 상태: 설계 승인 완료, 스펙 리뷰 대기

## 1. 배경 / 목표

현재 프로젝트 쇼케이스는 **정적 Vite+React** 앱으로, `public/data/projects.json`을 런타임에 읽어 보여주고 콘텐츠는 사람이 직접 JSON을 편집한다. 여기에 **프로젝트 생성·편집·관리 UI**를 추가한다.

확정된 요구사항:

- **온라인 관리자 페이지**로 만들고, **ZETIN 기존 계정**(newcompetition과 동일)으로 로그인한다.
- Rhymix 사이트에 **iframe으로 임베드되는 공개 쇼케이스는 보기 전용**(둘러보기·필터·상세·라이트박스만). **편집은 별도 URL(`/admin`)로 직접 들어가서** 한다 — newcompetition과 동일한 분리.
- 저장 방식은 **파일 기반(A안)**: 관리자 API가 `data/projects.json`과 `data/images/`를 직접 읽고 쓴다. DB 없음.
- 관리 UI 기능: **CRUD + 이미지 업로드 + 마크다운 편집기/미리보기 + 드래그 순서 변경**.

## 2. 최우선 제약 (Hard Constraint)

**사용자의 최종 승인 전까지 라이브 서비스에 어떠한 영향도 없어야 한다.** (이전 단계와 동일 원칙)

- 개발·검증은 GitHub 저장소와 로컬에서만 수행한다.
- 승인 전에는 Rhymix DB, `nginx-proxy-manager`, DNS, 기존 컨테이너를 변경하지 않는다.
- 로그인 테스트는 `ZETIN_AUTH_HOST=auth.zetin.uos.ac.kr`로 **실제 인증 서버에 검증 요청만** 보낸다. 이는 읽기 전용(자격 검증·공개키 조회)이라 라이브 서비스에 영향이 없다.
- 배포(Node 컨테이너 전환·서브도메인·Rhymix 임베드)는 **최종 승인 후 단계**로 분리한다.

## 3. 아키텍처

정적 프론트엔드에 **Node/Express 백엔드**를 추가해 풀스택으로 전환한다(선례: `server-zetin-competition`).

```
zetin-projects/
├── server/                     # NEW 백엔드 (Express)
│   ├── index.js                # 앱: client 빌드 + /api + /data 서빙
│   ├── routes/api/
│   │   ├── admin.js            # signin/signout/status (newcompetition 이식)
│   │   ├── projects.js         # GET(공개) + POST/PATCH/DELETE/order(🔒)
│   │   └── files.js            # POST 이미지 업로드(🔒), 이미지 서빙
│   ├── middlewares/admin.js    # 관리자 인증 미들웨어 (이식)
│   ├── modules/verifyAdmin.js  # JWT 검증 + ADMIN_ID 허용목록 (이식)
│   └── lib/store.js            # projects.json 원자적 read/write
├── src/                        # 프론트엔드
│   ├── (기존 공개 쇼케이스)
│   └── admin/                  # NEW 관리자 UI (lazy-load)
├── data/                       # projects.json + images/  (볼륨 마운트)
├── Dockerfile                  # 멀티스테이지: client 빌드 → node 서빙
└── docker-compose.yml          # (Phase 2)
```

한 컨테이너의 Express가 React 빌드(`/` 공개, `/admin` 관리)와 API, `/data`를 모두 서빙한다. 데이터 단일 소스는 마운트된 `data/` 파일이다.

## 4. 인증 (newcompetition 패턴 재사용)

newcompetition의 인증 코드를 거의 그대로 이식한다.

- `POST /api/admin/signin {id, pw}` → `https://{ZETIN_AUTH_HOST}/auth`로 ZETIN 계정 검증 → 성공 시 JWT 수신 → `verifyAdmin`으로 `ADMIN_ID`(콤마 구분) 허용목록 확인 → **HttpOnly 쿠키 `adminToken`**(path `/api`) 발급, payload 응답.
- `GET /api/admin/status` → 쿠키의 토큰 검증해 payload 반환(미로그인 시 401).
- `POST /api/admin/signout` → 쿠키 제거.
- `verifyAdmin(token)`: `https://{ZETIN_AUTH_HOST}/keys`의 JWK 공개키로 JWT 검증 후 `payload.username`이 `ADMIN_ID`에 포함되는지 확인.
- `admin()` 미들웨어: 보호 라우트에서 쿠키 토큰 검증, 통과 시 `req.isAdmin=true`.

환경변수: `ADMIN_ID`(관리자 계정, 콤마 구분), `ZETIN_AUTH_HOST`(기본 `auth.zetin.uos.ac.kr`), `PORT`, `PATH_DATA`(데이터 디렉토리).

## 5. 백엔드 API

- `GET /api/projects` — 공개. `data/projects.json`의 배열 반환(표시 순서 = 배열 순서).
- `POST /api/projects` 🔒 — 새 프로젝트 추가(끝에 추가). 서버가 `id` 유일성 검증.
- `PATCH /api/projects/:id` 🔒 — 부분 수정.
- `DELETE /api/projects/:id` 🔒 — 삭제(연결 이미지 파일 정리는 선택).
- `PUT /api/projects/order` 🔒 — `["id1","id2",...]` 순서로 배열 재배치.
- `POST /api/files` 🔒 — `multipart/form-data` 이미지 업로드. `data/images/<projectId>/<파일명>`에 저장하고 `data/images/...` 상대경로 반환. 허용 확장자·용량 제한 검증.
- 저장은 **원자적 쓰기**(temp 파일 작성 후 rename). 동시 쓰기는 프로세스 내 간단한 직렬화(쓰기 큐/뮤텍스)로 보호.

오류는 newcompetition처럼 `http-errors`로 상태코드+메시지 응답.

## 6. 데이터 모델

스키마는 기존과 동일: `id, title, category, year, summary, description(마크다운), members[], tech[], links[{label,url}], thumbnail?, images[]?, featured?`.

- **표시 순서 = `projects.json` 배열 순서**. 드래그 정렬이 배열을 재배치하고 `PUT /api/projects/order`로 저장한다.
- 공개 쇼케이스의 정렬을 기존 "연도 내림차순"에서 **배열 순서 유지**로 변경한다(`src/lib/filter.js`의 `sortProjects`를 항등 정렬로 단순화). 카테고리·연도·검색 필터는 그대로 유지한다.

## 7. 관리자 UI (`/admin`, 별도 진입)

- **로그인 화면**: ZETIN id/pw 입력 → `/api/admin/signin`. 실패 메시지 표시. `GET /api/admin/status`로 진입 시 로그인 상태 확인. 미인증이면 관리 화면 비노출.
- **목록·관리 화면**: 프로젝트 목록(행/카드), **드래그로 순서 변경**(저장 시 `PUT /api/projects/order`), 항목별 "수정"·"삭제", "새 프로젝트".
- **편집 폼**: `title, category, year, summary, members, tech, links` 입력 + **마크다운 편집기 + 실시간 미리보기**(description) + **이미지 업로드**(thumbnail, images 갤러리; 드롭/선택 → `POST /api/files` → 경로 자동 반영) + 저장(`POST`/`PATCH`).
- 관리자 UI는 **코드 스플리팅(lazy-load)**으로 분리해 공개 번들 크기에 영향 없게 한다.
- 마크다운 미리보기는 공개 상세와 동일 렌더러(react-markdown + remark-gfm + remark-breaks) 사용.

## 8. 공개 쇼케이스 변경 (최소)

- iframe 임베드용 보기 전용 화면은 그대로(편집 컨트롤 없음).
- 데이터 출처는 **기존 정적 `/data/projects.json` 유지**한다. 관리자 API가 이 파일을 갱신하고 Express가 `data/`를 정적 서빙하므로 공개 쇼케이스의 fetch 로직은 변경할 필요가 없다. (`GET /api/projects`는 관리자 UI가 현재 목록을 불러오는 용도로만 사용.)
- 정렬만 수동 순서(배열 순서)로 변경.

## 9. 배포 — *최종 승인 후 단계*

- Node 멀티스테이지 `Dockerfile`(client 빌드 → node 서빙). 정적 nginx 컨테이너를 대체.
- `docker-compose.yml`: `data/` 볼륨 마운트, `ADMIN_ID`·`ZETIN_AUTH_HOST` 환경변수, `zetin-srv` 외부 네트워크.
- `nginx-proxy-manager`에 `projects.zetin.uos.ac.kr` + SSL. Rhymix `page`에 **공개 URL**을 iframe 임베드(관리 URL은 임베드하지 않음).

## 10. 테스트 계획

- **백엔드(단위/통합)**: `verifyAdmin`(허용/거부/만료), `admin()` 미들웨어(쿠키 유무), projects CRUD·order, 파일 업로드(저장 모킹), 원자적 저장 동작. 인증 서버 호출은 모킹.
- **프론트(RTL)**: 로그인 폼(성공/실패), 편집 폼 검증·마크다운 미리보기, 드래그 정렬 상호작용, 공개 쇼케이스 회귀(기존 테스트 유지).
- **수동**: 로컬에서 실제 ZETIN 계정 로그인(읽기 전용 검증), 생성→수정→업로드→정렬→삭제 왕복 확인.

## 11. 범위 밖 (YAGNI)

- 데이터베이스(파일 기반으로 충분).
- 역할/권한 세분화(단일 관리자 그룹 = `ADMIN_ID`).
- 변경 이력/버전관리(필요 시 git/백업으로 대응).
- 공개 쇼케이스 내 인라인 편집(편집은 `/admin` 전용).

## 12. 미해결 / 확인 필요

- `ADMIN_ID`에 넣을 실제 관리자 ZETIN 계정 목록.
- newcompetition이 사용하는 인증 의존성 버전(`jsonwebtoken`, `jwk-to-pem`, `axios`) 확인 및 도입.
- 이미지 업로드 허용 형식·최대 용량 정책.
