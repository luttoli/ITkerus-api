# ITkerus API 프로젝트 기준

이 문서는 ITkerus 서버의 확정 설계와 전체 로드맵을 관리한다. 현재 구현 상태와 바로 다음 한 작업은 `STATUS.md`를 기준으로 한다.

## 1. 서버 역할

ITkerus API는 iOS 앱의 인증과 영구 데이터를 관리하고 사용자 권한과 데이터 정합성을 보장한다.

서버가 담당하는 범위:

- Apple·Kakao 소셜 토큰 검증과 자체 세션 발급
- 사용자 프로필과 주 역할·보조 역할 저장
- 프로젝트 생성·조회·수정·삭제
- 잇커스 노트 작성과 프로젝트 작성자의 `도움됐어요` 표시
- 최신 프로젝트, 검색·필터·정렬, ITkerus MATCH와 Spotlight 조회
- 알림 설정, 공지사항, 이용약관과 개인정보 처리방침
- 신고·차단·금지어와 관리자 운영에 필요한 최소 데이터
- 요청 제한, 인증·인가, 백업, 복원과 장애 감지

2.0에서 서버가 담당하지 않는 범위:

- 프로젝트 이미지 직접 업로드와 이미지 파일 보관
- App Store·Google Play·Web 공개 이미지를 서버 저장소로 복제하는 작업
- Supabase, Vapor, 실시간 채팅, 외주·채용과 현금성 리워드
- 앱 설치 여부나 App Store 리뷰 작성 여부 검증

## 2. 기술 스택과 저장소

- 저장소: `github.com/luttoli/ITkerus-api`
- 로컬 경로: `/Users/luttoli/Documents/Server/apps/ITkerus-api`
- 언어: TypeScript
- API: NestJS 11
- ORM: Prisma 6
- DB: MariaDB 11.4
- 개발 도구: VS Code, OrbStack 또는 Docker, DBeaver
- 운영 위치: Mac mini 홈서버

서버 코드는 개발·운영이 동일하다. 환경마다 `.env`와 DB, 외부 서비스 자격 증명만 다르게 사용한다.

| 환경 | 기기 | DB | 실행 파일 |
|---|---|---|---|
| 개발 | 맥북 | `itkerus_dev` | `.env.development` |
| 운영 | Mac mini | `itkerus_prod` | `.env.production` |

Prisma의 개발 마이그레이션은 고정된 `itkerus_dev_shadow`를 변경 비교용으로 사용한다. `itkerus_dev_app`은 개발 DB와 shadow DB에만 스키마 변경 권한을 가지며 전체 MariaDB의 DB 생성 권한은 갖지 않는다. 운영 `migrate deploy`에는 shadow DB를 만들지 않는다.

## 3. 데이터 모델 기준

모든 공개 ID는 UUID 문자열을 사용한다. 날짜는 UTC로 저장하고 JSON에서는 ISO 8601 문자열로 반환한다.

### User

- 닉네임: 앞뒤 공백 제거 후 2~10자, 고유값
- 한 줄 소개: 선택값, 최대 60자
- 역할 enum: `DEVELOPER`, `PLANNER`, `DESIGNER`, `MARKETER`, `OPERATOR`, `USER_TESTER`
- 주 역할: 가입 완료 시 1개 필수
- 보조 역할: 최대 2개, 주 역할과 중복 불가
- 소셜 토큰 검증 직후에는 온보딩 전 `User`를 먼저 만들 수 있으므로 닉네임과 주 역할은 DB에서 `NULL`을 허용한다.
- `isOnboardingCompleted`가 `true`가 되는 요청에서 닉네임·주 역할 필수, 보조 역할 최대 2개와 주 역할 중복 금지를 서비스 트랜잭션으로 검증한다.
- 보조 역할은 `UserSecondaryRole` 관계 테이블에 저장하고 `(userId, role)` 고유 제약으로 같은 역할 중복을 막는다.
- 사용자가 직접 프로필 이미지를 등록하지 않으며 iOS가 주 역할 기본 이미지를 사용
- 이메일은 계정 고유 식별자로 사용하지 않음

### SocialAccount

- 제공자: `APPLE`, `KAKAO`
- 제공자 사용자 ID와 `User`를 연결
- `(provider, providerUserId)`를 고유값으로 유지
- `(userId, provider)`도 고유값으로 유지해 한 사용자가 같은 제공자 계정을 중복 연결하지 못하게 함
- 사용자가 삭제되면 연결된 소셜 계정과 보조 역할도 함께 삭제
- Apple·Kakao가 검증한 식별자만 저장하고 클라이언트가 주장한 임의 ID를 신뢰하지 않음

### ProjectPost

- 작성자, 제목, 한 줄 소개, 프로젝트 이야기
- 상태: `IN_DEVELOPMENT`, `RELEASED`
- 목적: `INTRODUCTION`, `QUESTION`을 하나 이상 선택
- `QUESTION`이 있으면 최대 150자의 잇커스 포커스 필수
- 필요한 역할은 0개 이상이며 비어 있으면 전체 사용자를 의미
- 출시 프로젝트는 공개 링크가 하나 이상 필요
- 링크 종류: `APP_STORE`, `GOOGLE_PLAY`, `WEB`
- 외부 아이콘 URL, 외부 이미지 URL 목록과 선택한 대표 이미지 URL 저장
- 개발 중 프로젝트는 외부 이미지 없이 프로젝트 ID 기반 추상 마크 사용
- 삭제는 초기 구현에서 즉시 삭제하지 않고 `deletedAt`을 사용하는 소프트 삭제를 기본으로 검토

### ITkerusNote

- 프로젝트, 작성자, 작성 당시 주 역할, 최대 600자의 의견
- `직접 써봤어요` 여부
- `도움됐어요`는 프로젝트 작성자만 표시·취소 가능
- 작성자 본인의 프로젝트에는 노트를 남길 수 없음
- 한 사용자가 같은 프로젝트에 작성할 수 있는 노트 개수는 API 구현 전에 최종 확정

### 집계와 파생 값

- 잇커스 노트 수와 도움 수는 초기에는 원본 행을 DB에서 집계한다.
- 조회 수는 중복 증가와 봇 요청 정책을 정한 뒤 별도 모델 또는 카운터로 구현한다.
- 열정 불꽃은 이름과 산정 규칙이 확정될 때까지 원본 도움 활동에서 계산하고 별도 점수 테이블을 만들지 않는다.
- Spotlight는 도움 수와 잇커스 노트 수를 DB 집계로 계산한다.

### 운영 모델

- `Notice`: 공지 목록·상세
- `LegalDocument`: 이용약관·개인정보 처리방침과 시행일
- `NotificationPreference`: 푸시·서비스 공지 수신 설정
- `PushDevice`: APNs 토큰과 Sandbox·Production 환경
- `Report`: 신고 대상, 사유와 처리 상태
- `UserBlock`: 차단한 사용자와 차단된 사용자
- `AppVersionPolicy`: iOS 최소 지원 버전

운영 모델은 핵심 사용자·프로젝트·노트 흐름이 완료된 뒤 순서대로 추가한다.

## 4. API 원칙

- 기본 경로는 `/api/v1`이다.
- 인증 헤더는 `Authorization: Bearer <token>`을 사용한다.
- 성공 응답 DTO는 화면에 필요한 정보만 반환한다.
- 오류는 HTTP 상태와 안정적인 `code`, 사용자 표시용 `message`를 반환한다.
- 목록은 `limit`과 불투명한 `cursor`를 사용하며 응답에 `nextCursor`를 포함한다.
- 목록 응답과 상세 응답을 분리해 홈에서 긴 이야기와 전체 노트를 내려받지 않는다.
- 자신의 글, 차단·신고·삭제 대상과 이미 노트를 남긴 프로젝트는 MATCH 후보에서 제외한다.
- 검색어·역할·상태·정렬 필터는 DB 쿼리에서 적용한다.

초기 API 범위:

### 인증과 사용자

- `POST /auth/login`
- `GET /users/me`
- `PATCH /users/me/profile`
- `GET /users/:id`
- `DELETE /users/me`

### 프로젝트

- `GET /projects`
- `GET /projects/match`
- `GET /projects/:id`
- `POST /projects`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

`GET /projects`는 `cursor`, `limit`, `query`, `role`, `status`, `purpose`, `sort`를 선택적으로 받는다.

### 잇커스 노트

- `GET /projects/:projectId/notes`
- `POST /projects/:projectId/notes`
- `PATCH /projects/:projectId/notes/:noteId`
- `DELETE /projects/:projectId/notes/:noteId`
- `PUT /projects/:projectId/notes/:noteId/helpful`
- `DELETE /projects/:projectId/notes/:noteId/helpful`

### My·Spotlight

- `GET /users/me/activity-summary`
- `GET /users/me/projects`
- `GET /users/me/notes`
- `GET /spotlight/projects`

상세 요청·응답 DTO는 Prisma 모델을 그대로 노출하지 않고 각 기능 구현 직전에 iOS 모델과 함께 확정한다.

## 5. 인증과 권한

- Apple과 Kakao 토큰은 공식 공개키, issuer, audience, 만료와 nonce를 서버가 검증한다.
- 검증 성공 후 자체 JWT를 발급하고 iOS는 Keychain에 저장한다.
- 신규 사용자는 로그인 뒤 닉네임·주 역할·보조 역할을 저장해야 가입 완료 상태가 된다.
- 프로젝트 수정·삭제는 작성자만 가능하다.
- 노트 수정·삭제는 노트 작성자만 가능하다.
- `도움됐어요` 표시·취소는 해당 프로젝트 작성자만 가능하다.
- 차단 관계가 있으면 상대의 프로젝트, 프로필과 노트를 서로 노출하지 않는다.
- 회원탈퇴는 Apple·Kakao 연결 해제, 데이터 보관 기간과 복구 가능 여부를 확정한 뒤 구현한다.

## 6. DB와 마이그레이션

- 개발 스키마 변경은 `npm run prisma:migrate:dev -- --name 이름`으로 마이그레이션 파일을 만든다.
- 운영은 커밋된 마이그레이션을 `npm run prisma:migrate:prod`로만 적용한다.
- 운영 DB에 `prisma db push`를 실행하지 않는다.
- 모든 실제 테이블·컬럼에 DBeaver용 한국어 Comment를 적용한다.
- Comment는 `prisma/add-database-comments.ts`에서 누락 여부를 먼저 검사한 뒤 적용한다. 개발은 `npm run db:comments:dev`, 운영은 마이그레이션 배포 뒤 `npm run db:comments:prod`를 실행한다.
- 운영 반영 전 DB 백업과 체크섬을 만들고 별도 임시 DB에 복원해 실제 복구 가능성을 확인한다.
- 데이터 삭제·enum 변경·필수 컬럼 추가는 기존 데이터 변환 순서와 롤백 방법을 먼저 문서화한다.

## 7. 개발·운영 배포

개발 환경:

- 맥북의 공용 Docker MariaDB를 사용한다.
- 실제 앱 데이터는 `itkerus_dev`, Prisma 변경 비교는 `itkerus_dev_shadow`를 사용한다.
- DB 포트는 외부에 공개하지 않고 `127.0.0.1`에만 바인딩한다.
- DBeaver는 맥북 개발 DB 연결만 사용한다.
- iOS Debug는 같은 네트워크의 맥북 개발 API를 사용한다.

운영 환경:

- Mac mini의 공용 Docker MariaDB에 운영 전용 DB와 계정을 만든다.
- API는 Docker 컨테이너의 일반 사용자 권한과 읽기 전용 파일시스템으로 실행한다.
- Cloudflare Tunnel 또는 확정된 공개 HTTPS 경로로 API만 노출한다.
- DB, Redis와 관리 도구는 인터넷에 공개하지 않는다.
- 재시작 정책, 헬스체크, 로그 크기 제한과 Uptime Kuma 장애 알림을 구성한다.
- DB 자동 백업, 암호화된 2차 보관과 실제 복원 검증을 완료한다.

## 8. 구현 로드맵

### 1단계: 개발 기반

- 개발 DB와 전용 계정 생성
- 실제 `.env.development` 작성
- 최초 마이그레이션과 DB Comment 체계 구축
- health API에서 앱 상태와 DB 연결 상태 분리 확인

### 2단계: 인증과 프로필

- Apple·Kakao 토큰 검증
- JWT 발급·검증 Guard
- 신규·기존 사용자 분기
- 닉네임·주 역할·보조 역할 저장과 조회

### 3단계: 프로젝트

- 프로젝트와 목적·필요 역할·링크·외부 이미지 스키마
- 프로젝트 CRUD와 작성자 권한
- 공개 목록의 커서 페이지네이션
- 프로젝트 상세 조회

### 4단계: 잇커스 노트와 도움

- 노트 CRUD와 작성자 권한
- 직접 사용 여부와 작성 당시 역할 저장
- 프로젝트 작성자의 도움 표시·취소
- My 활동 요약과 원본 행 기반 집계

### 5단계: 탐색

- 역할·상태·목적 필터와 검색
- 최신순·노트순·도움순 정렬
- 사용자별 하루 고정 MATCH
- Spotlight 집계

### 6단계: 운영 기능

- 알림 설정과 APNs 토큰
- 공지사항·법적 문서·앱 버전 정책
- 신고·차단·금지어와 요청 제한
- 회원탈퇴와 소셜 연결 해제

### 7단계: iOS 연결

- 로컬 Repository를 API Repository로 교체
- Debug·Release 서버 주소 자동 분리
- 로딩·빈 화면·오류·캐시와 401 자동 로그아웃
- 기능별 실기기 end-to-end 확인

### 8단계: 운영 배포

- Docker 이미지와 운영 Compose
- Mac mini 운영 DB와 비밀값
- HTTPS·도메인·헬스체크·자동 시작
- 백업·복원·장애 알림
- TestFlight 운영 환경 전체 검수

## 9. 아직 확정할 항목

- 한 사용자가 같은 프로젝트에 남길 수 있는 잇커스 노트 개수
- 조회 수 증가 기준과 중복·봇 요청 처리
- 열정 불꽃의 최종 명칭과 계산 규칙
- 회원탈퇴의 유예 기간과 콘텐츠 익명화·삭제 범위
- 신고 누적에 따른 자동 숨김 여부와 관리자 처리 방식
- 운영 API 도메인과 APNs 알림 종류
