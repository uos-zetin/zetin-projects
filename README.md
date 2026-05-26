# zetin-projects

ZETIN 프로젝트 쇼케이스. Rhymix 홈페이지에 iframe으로 임베드되는 정적 페이지(Vite + React).

## 개발
```sh
npm install
npm run dev        # 개발 서버
npm test           # 테스트
npm run build      # 프로덕션 빌드 → dist/
npm run preview    # 빌드 결과 로컬 미리보기(127.0.0.1:4173)
```

## 콘텐츠 갱신
프로젝트 목록은 `public/data/projects.json`에서 관리한다. 운영 환경에서는 이 경로에
호스트의 `data/` 디렉토리가 볼륨 마운트되므로, **JSON과 이미지를 수정하면 재빌드 없이 반영**된다.

projects.json 스키마는 설계 문서
`docs/superpowers/specs/2026-05-26-zetin-homepage-content-refresh-design.md` 참고.

## 배포
멀티스테이지 `Dockerfile`로 이미지를 빌드해 nginx로 서빙한다. 서브도메인 라우팅·
docker-compose·Rhymix 임베드는 Phase 2에서 구성한다.
