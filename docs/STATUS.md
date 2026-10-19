# ITkerus API 현재 상태

이 문서는 과거 작업 일지를 쌓지 않고 현재 구현 상태, 검증 결과, 남은 문제와 바로 다음 작업을 유지한다.

## 1. 현재 기준

- 확인일: 2026-10-20
- 작업 PC: 맥북
- 브랜치: `main`
- 원격 저장소: `github.com/luttoli/ITkerus-api`
- 마지막 커밋: `5bc0ae1 [chore] NestJS 서버 기본 프로젝트와 환경 분리 구성 / 2.0.22`
- 앱 공개 버전: `2.0.22`
- 서버 패키지 버전: `0.0.1`

## 2. 현재 구현 상태

- [x] NestJS 11·TypeScript 프로젝트 생성
- [x] Prisma 6·MariaDB datasource와 전역 Prisma Module 추가
- [x] 기본 경로 `/api/v1` 적용
- [x] 맥북 `.env.development`와 Mac mini `.env.production` 실행 명령 분리
- [x] 개발 `migrate dev`와 운영 `migrate deploy` 명령 분리
- [x] 서버 전용 GitHub 저장소 연결과 첫 push
- [x] 서버 `AGENTS.md`, `docs/PROJECT.md`, `docs/STATUS.md` 기준 문서 구성
- [x] 맥북 공용 `bnb-mariadb`에 `itkerus_dev`와 `itkerus_dev_shadow` 생성
- [x] `itkerus_dev_app` 전용 계정에 두 개발 DB만 접근할 수 있는 권한 부여
- [x] 무작위 개발 비밀번호를 Git 제외 `.env.development`에 권한 `600`으로 저장
- [x] health 기능을 Controller·Service·Module로 분리
- [x] `GET /api/v1/health`가 앱 상태와 실제 MariaDB 연결 상태를 확인

## 3. 검증 상태

확인 완료:

- OrbStack의 MariaDB·Redis·Portainer·Uptime Kuma 컨테이너 실행 상태
- `itkerus_dev`, `itkerus_dev_shadow` 존재와 전용 계정의 DB별 권한
- `.env.development` 권한 `600`과 Git 제외
- `npm run prisma:generate`
- `npm run prisma:migrate:dev -- --name init` 연결 성공과 현재 스키마 동기화 상태
- `npm run build`
- `npm test -- --runInBand` 2개 통과
- NestJS 개발 서버 시작과 TypeScript 오류 0개
- `GET /api/v1/health`의 `status: ok`, `database: connected` 응답

아직 확인하지 않음:

- DBeaver에서 사용자가 `itkerus_dev` 연결과 스키마 직접 확인
- 앱 모델이 없어 첫 마이그레이션 파일은 아직 생성되지 않음
- Mac mini 운영 컨테이너와 `itkerus_prod` 연결

## 4. 바로 다음 작업

사용자와 소셜 계정·역할의 최초 Prisma 스키마를 만들고 첫 개발 마이그레이션을 생성한다.

- [ ] `User` 모델에 UUID, 닉네임, 소개, 주 역할과 가입 완료 상태 정의
- [ ] `SocialAccount`에 Apple·Kakao 제공자와 검증된 사용자 식별자 정의
- [ ] 보조 역할 최대 2개를 저장할 관계 모델 정의
- [ ] 고유 제약, 인덱스와 삭제 정책 정의
- [ ] 모든 실제 컬럼의 DBeaver용 한국어 Comment 정의
- [ ] 첫 `prisma migrate dev` 실행
- [ ] Prisma Client 생성과 서버 빌드·테스트
- [ ] DBeaver에서 테이블·제약·Comment 확인

## 5. 전체 구현 체크리스트

### 개발 기반

- [x] 개발·운영 환경 파일과 명령 분리
- [x] 개발 DB·계정과 shadow DB 연결
- [x] health API의 실제 DB 연결 확인
- [ ] 최초 사용자 스키마와 개발 마이그레이션
- [ ] DB 컬럼 Comment 자동 적용과 누락 검사
- [ ] 환경변수 필수값 검증
- [ ] 공통 오류 응답과 요청 ID

### 인증과 사용자

- [ ] `User`, `SocialAccount`, 사용자 역할 스키마
- [ ] Apple ID 토큰 검증
- [ ] Kakao ID 토큰 검증
- [ ] JWT 발급·검증 Guard
- [ ] 신규·기존 사용자 분기
- [ ] 닉네임·소개·주 역할·보조 역할 저장
- [ ] 내 프로필·공개 프로필 조회
- [ ] 로그아웃과 회원탈퇴

### 프로젝트

- [ ] 프로젝트·목적·필요 역할·링크·외부 이미지 스키마
- [ ] 프로젝트 생성과 전체 입력 검증
- [ ] 프로젝트 수정·삭제와 작성자 권한
- [ ] 최신 프로젝트 커서 페이지네이션
- [ ] 프로젝트 상세 조회
- [ ] 외부 URL 형식과 출시 상태 조건 검증

### 잇커스 노트와 도움

- [ ] 잇커스 노트 스키마와 CRUD
- [ ] 본인 프로젝트 작성 차단
- [ ] 직접 사용 여부와 작성 당시 역할 저장
- [ ] 프로젝트 작성자의 도움 표시·취소
- [ ] My 활동 요약 집계

### 검색·매치·Spotlight

- [ ] 검색어·역할·상태·목적 필터
- [ ] 최신순·노트순·도움순 정렬
- [ ] 사용자별 하루 고정 MATCH
- [ ] 자신의 글·차단·삭제·기작성 노트 후보 제외
- [ ] Spotlight DB 집계

### 운영 기능

- [ ] 공지사항과 법적 문서
- [ ] 앱 최소 지원 버전
- [ ] 알림 설정과 APNs 기기 토큰
- [ ] 신고·차단·금지어
- [ ] 요청 제한과 감사 로그

### iOS 연동

- [ ] Debug 개발 API와 Release 운영 API 자동 분리
- [ ] 로그인·온보딩 API 연결
- [ ] 로컬 ProjectRepository를 API 구현으로 교체
- [ ] 캐시·페이지네이션·오류·401 자동 로그아웃
- [ ] 기능별 실기기 end-to-end 검증

### 운영 배포

- [ ] 비루트·읽기 전용 Docker 이미지
- [ ] Mac mini 운영 DB와 비밀값
- [ ] HTTPS 도메인과 Cloudflare Tunnel
- [ ] 자동 재시작·헬스체크·로그 제한
- [ ] Uptime Kuma 장애 알림
- [ ] 매일 DB 백업과 보관 기간
- [ ] 암호화 2차 백업
- [ ] 별도 임시 DB 실제 복원 테스트
- [ ] TestFlight 운영 환경 전체 검수

## 6. 남은 결정과 주의

- 한 사용자가 같은 프로젝트에 잇커스 노트를 여러 개 남길 수 있는지 확정해야 한다.
- 조회 수 증가와 중복 방지 정책을 확정하기 전에는 단순 요청마다 카운트를 올리지 않는다.
- 열정 불꽃 규칙이 정해지기 전에는 별도 점수 테이블을 만들지 않는다.
- 운영 DB에는 `db push`나 `migrate dev`를 실행하지 않는다.
- 2.0에는 프로젝트 이미지 직접 업로드를 추가하지 않는다.
- 서버 구현 세부사항은 이 문서에, iOS 계약에 영향을 주는 내용은 양쪽 저장소 문서에 함께 반영한다.
