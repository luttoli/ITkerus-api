# ITkerus API 현재 상태

이 문서는 과거 작업 일지를 쌓지 않고 현재 구현 상태, 검증 결과, 남은 문제와 바로 다음 작업을 유지한다.

## 1. 현재 기준

- 확인일: 2026-10-28
- 작업 PC: 맥북
- 브랜치: `main`
- 원격 저장소: `github.com/luttoli/ITkerus-api`
- 작업 시작 커밋: `a1f6d5e [refactor] 자동 증가 숫자 ID 체계로 전환 / 2.0.33`
- 앱 공개 버전: `2.0.34`
- 서버 패키지 버전: `0.0.1`

## 2. 현재 구현 상태

- [x] NestJS 11·TypeScript 프로젝트와 `/api/v1` 기본 경로
- [x] Prisma 6·MariaDB datasource와 전역 Prisma Module
- [x] 맥북 `.env.development`와 Mac mini `.env.production` 실행·마이그레이션 명령 분리
- [x] 맥북 공용 MariaDB의 `itkerus_dev`, `itkerus_dev_shadow`와 전용 `itkerus_dev_app` 계정
- [x] 실제 DB 연결을 확인하는 `GET /api/v1/health`
- [x] `User`, `SocialAccount`, `UserSecondaryRole` 최초 Prisma 스키마
- [x] 자동 증가 숫자 ID, 닉네임 고유 제약, Apple·Kakao 제공자 식별자 복합 고유 제약
- [x] 주 역할 6종 enum과 보조 역할 중복 방지 관계
- [x] 사용자 삭제 시 소셜 계정·보조 역할 `CASCADE` 삭제
- [x] 온보딩 전 사용자와 가입 완료 상태를 구분하는 `isOnboardingCompleted`
- [x] 실제 테이블·컬럼의 한국어 Comment 자동 적용과 누락 검사 명령
- [x] 첫 개발 마이그레이션 `20261019162754_add_user_accounts_and_roles`
- [x] 자체 액세스 JWT 발급·검증 서비스와 개발용 무작위 비밀키
- [x] Bearer 토큰 공통 `AccessTokenGuard`와 `CurrentUserId` 데코레이터
- [x] 토큰 누락·변조·만료의 안정적인 401 오류 코드
- [x] JWT 비밀키 최소 32자와 양의 정수 만료 시간 시작 검증
- [x] `POST /api/v1/auth/login` 요청·응답과 전역 DTO 런타임 검증
- [x] Apple·Kakao 공식 원격 JWKS와 issuer·audience·만료·nonce 검증
- [x] 검증된 제공자 ID 기준 신규 사용자 생성과 기존 사용자 조회
- [x] 로그인 응답의 자체 액세스 JWT와 신규·온보딩 완료 상태
- [x] 1시간 액세스 JWT와 90일 리프레시 세션 동시 발급
- [x] 리프레시 원문 미저장·SHA-256 해시 저장과 토큰 회전
- [x] 사용된 리프레시 토큰 재사용 감지와 같은 세션 계보 전체 폐기
- [x] `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- [x] 이용약관·개인정보 처리방침 동의 전 신규 계정 생성과 세션 발급 차단
- [x] `AUTH_CONSENT_REQUIRED` 428과 필수 동의 일시 저장
- [x] `GET /api/v1/users/me` 인증 사용자 프로필 조회
- [x] `PATCH /api/v1/users/me/profile` 온보딩 프로필 저장
- [x] 닉네임 2~10자·소개 최대 60자와 역할 배열 런타임 검증
- [x] 보조 역할 최대 2개·중복 금지·주 역할 중복 금지
- [x] 프로필·보조 역할 원자적 교체와 온보딩 완료 전환
- [x] 닉네임 중복 409와 삭제된 토큰 사용자 401 오류 코드
- [x] `ProjectPost`, `ProjectPostPurpose`, `ProjectRequestedRole`, `ProjectLink`, `ProjectImage` 스키마
- [x] 프로젝트 상태·목적·링크 종류 enum과 자동 증가 숫자 ID, 정렬·필터 인덱스
- [x] 사용자 삭제 `RESTRICT`, 프로젝트 하위 관계 `CASCADE`와 프로젝트 `deletedAt`
- [x] 인증 사용자의 `POST /api/v1/projects` 생성 API
- [x] 제목·소개·이야기 길이, enum·배열 중복과 HTTPS 외부 URL 런타임 검증
- [x] 고민 FOCUS, 출시 링크, 개발 중 외부 미디어와 대표 이미지 조건 검증
- [x] 온보딩 미완료 403과 프로젝트 조건별 안정적인 오류 코드
- [x] 프로젝트와 목적·역할·링크·이미지의 원자적 중첩 저장
- [x] 작성자 전용 `PATCH /api/v1/projects/:id` 부분 수정 API
- [x] 기존 값과 요청값을 합친 최종 프로젝트의 전체 조건 재검증
- [x] 목적·필요 역할·링크·이미지의 원자적 전체 교체
- [x] 선택 FOCUS·외부 아이콘·대표 이미지의 명시적 `null` 제거
- [x] 작성자 전용 `DELETE /api/v1/projects/:id` 소프트 삭제와 204 응답
- [x] 미존재 404·타인 소유 403·삭제 상태 410 오류 코드
- [x] 인증 없이 조회하는 `GET /api/v1/projects/:id` 공개 상세 API
- [x] 작성자 닉네임·주 역할·보조 역할과 프로젝트 전체 관계 조회
- [x] 소프트 삭제·불완전 작성자 프로필 프로젝트의 공개 조회 차단
- [x] 잇커스 노트 모델 전까지 상세 통계 0 응답
- [x] 공개 조회와 인증 쓰기 API의 Guard 범위 분리
- [x] 인증 없이 조회하는 `GET /api/v1/projects` 최신 프로젝트 목록 API
- [x] 목록 `limit` 기본 20·최대 50 런타임 검증
- [x] `createdAt DESC, id DESC` 안정 정렬과 불투명 복합 커서
- [x] 잘못된 커서 `PROJECT_CURSOR_INVALID` 400 오류 코드
- [x] 목록 전용 경량 응답과 작성자 공개 요약·대표 이미지·링크 종류
- [x] 소프트 삭제·불완전 작성자 프로필 프로젝트 목록 제외
- [x] `(deletedAt, createdAt, id)` 목록 전용 복합 인덱스
- [x] 프로젝트 제목·한 줄 소개·작성자 닉네임 부분 검색
- [x] 필요한 역할·상태·목적 enum 필터와 런타임 검증
- [x] 요청 역할이 비어 있는 전체 대상 프로젝트의 역할 필터 포함
- [x] `LATEST`, `ITKERUS_NOTES`, `HELPFUL` 정렬 계약과 기본 최신순
- [x] 검색·필터·정렬 범위가 다른 커서 재사용 400 차단
- [x] `ITkerusNote`와 작성 당시 역할·직접 사용·도움 표시·소프트 삭제 스키마
- [x] 한 사용자·한 프로젝트의 노트 하나 고유 제약과 조회용 인덱스
- [x] 사용자 삭제 `RESTRICT`, 프로젝트 삭제 `CASCADE` 노트 관계
- [x] 인증 사용자의 `POST /api/v1/projects/:projectId/notes` 생성 API
- [x] 내용 1~600자와 Boolean 직접 사용 여부 런타임 검증
- [x] 미완료 프로필·삭제 프로젝트·본인 프로젝트·중복 작성 오류 처리
- [x] 삭제한 노트 재작성 시 기존 행 복원과 도움 표시 초기화

## 3. 검증 상태

확인 완료:

- 첫 마이그레이션을 `itkerus_dev`에 생성·적용하고 Prisma Client 생성
- `User`, `SocialAccount`, `UserSecondaryRole` 테이블과 모든 컬럼의 한국어 Comment
- 닉네임, 제공자 식별자, 사용자별 제공자, 사용자별 보조 역할 고유 인덱스
- 사용자 관계의 외래키와 `ON DELETE CASCADE`
- `npm run build`
- ESLint 오류 0개
- `npm test -- --runInBand` 105개 통과
- 실제 `.env.development`로 서버 시작과 `GET /api/v1/health` 200·DB 연결 응답
- 실제 서버의 로그인 DTO 오류 400, 변조된 Apple 토큰 401, Kakao 설정 누락 503 응답
- 보호된 프로필 조회·저장의 무인증 401 응답
- 개발 DB 임시 사용자의 프로필·보조 역할 저장과 조회 후 검증 데이터 완전 삭제
- 프로젝트 마이그레이션 `20261022154739_add_project_posts` 생성·개발 DB 적용
- 프로젝트 관련 다섯 테이블과 모든 컬럼의 한국어 Comment 적용
- 프로젝트 DTO·서비스·컨트롤러 단위 테스트
- 프로젝트 수정·삭제 DTO, 최종 상태 검증, 소유권과 삭제 경쟁 상태 단위 테스트
- 프로젝트 상세 응답 변환, 작성자 공개 정보와 삭제 프로젝트 404 단위 테스트
- 목록 기본값·최대 제한, 최신순 조회, 다음 커서와 잘못된 커서 단위 테스트
- 목록 복합 인덱스 마이그레이션 `20261024182012_add_project_list_cursor_index` 개발 DB 적용
- 인덱스 적용 후 전체 테이블·컬럼 한국어 Comment 누락 검사
- 검색어 정리, enum 검증, 검색·필터 조합과 커서 범위 단위 테스트
- 노트 마이그레이션 `20261024183309_add_itkerus_notes` 생성·개발 DB 적용
- `ITkerusNote` 테이블·컬럼의 한국어 Comment 적용과 전체 누락 검사
- 노트 DTO·생성 서비스·인증 컨트롤러 단위 테스트
- 사용자 동의 마이그레이션 `20261025163355_add_user_legal_consent` 생성·개발 DB 적용
- 신규·기존 사용자의 동의 필요 428, 동의 저장과 로그인 완료 단위 테스트
- 숫자 ID 전환 마이그레이션 `20261026023000_use_incrementing_integer_ids`로 개발 테스트 데이터를 초기화하고 전체 기본키·외래키를 `Int AUTO_INCREMENT`로 재생성
- JWT 사용자 ID, 프로젝트 경로 변수와 목록 커서를 숫자 ID로 전환
- 숫자 ID 전환 뒤 Prisma Client 생성, 서버 빌드와 단위 테스트 96개 통과
- 숫자 ID 스키마의 전체 테이블·컬럼 한국어 Comment 적용과 누락 검사
- 리프레시 세션 마이그레이션 `20261028120000_add_refresh_sessions` 개발 DB 적용
- `RefreshSession` 테이블·컬럼 한국어 Comment 적용과 전체 누락 검사
- 리프레시 토큰 발급·회전·만료·재사용 감지와 DTO 설정 단위 테스트

사용자 확인 항목:

- DBeaver에서 `itkerus_dev`의 프로젝트 관련 테이블과 `ITkerusNote`, 관계와 Comment를 화면으로 확인

아직 확인하지 않음:

- Mac mini 운영 컨테이너와 `itkerus_prod` 연결
- 운영 환경의 `migrate deploy`와 Comment 명령
- 실제 Apple ID 토큰으로 신규·기존 사용자 로그인과 DB 저장
- Kakao Developers 앱 키 등록·OpenID Connect 활성화 후 실제 Kakao ID 토큰 로그인

## 4. 바로 다음 작업

프로젝트별 잇커스 노트 목록 조회와 노트 수정·삭제 API를 구현한다.

- [ ] `GET /api/v1/projects/:projectId/notes` 공개 커서 목록과 작성자 공개 요약
- [ ] 노트 작성자 전용 `PATCH /api/v1/projects/:projectId/notes/:noteId`
- [ ] 노트 작성자 전용 `DELETE /api/v1/projects/:projectId/notes/:noteId` 소프트 삭제
- [ ] 프로젝트 상세·목록의 실제 노트 수 집계 연결

그다음 프로젝트 작성자의 `도움됐어요` 표시·취소 API와 도움 수 집계를 구현한다.

## 5. 전체 구현 체크리스트

### 개발 기반

- [x] 개발·운영 환경 파일과 명령 분리
- [x] 개발 DB·계정과 shadow DB 연결
- [x] health API의 실제 DB 연결 확인
- [x] 최초 사용자 스키마와 개발 마이그레이션
- [x] DB 테이블·컬럼 Comment 자동 적용과 누락 검사
- [ ] 환경변수 필수값 검증
- [ ] 공통 오류 응답과 요청 ID

### 인증과 사용자

- [x] `User`, `SocialAccount`, 사용자 역할 스키마
- [x] JWT 발급·검증 Guard
- [x] Apple ID 토큰 검증
- [x] Kakao ID 토큰 검증
- [x] 신규·기존 사용자 분기
- [x] 닉네임·소개·주 역할·보조 역할 저장
- [x] 내 프로필 조회
- [ ] 공개 프로필 조회
- [x] 로그아웃 세션 폐기
- [ ] 회원탈퇴

### 프로젝트

- [x] 프로젝트·목적·필요 역할·링크·외부 이미지 스키마
- [x] 프로젝트 생성과 전체 입력 검증
- [x] 프로젝트 수정·삭제와 작성자 권한
- [x] 최신 프로젝트 커서 페이지네이션
- [x] 프로젝트 상세 조회
- [x] 외부 URL 형식과 출시 상태 조건 검증

### 잇커스 노트와 도움

- [ ] 잇커스 노트 CRUD — 스키마·생성 완료, 목록·수정·삭제 예정
- [x] 본인 프로젝트 작성 차단
- [x] 직접 사용 여부와 작성 당시 역할 저장
- [ ] 프로젝트 작성자의 도움 표시·취소
- [ ] My 활동 요약 집계

### 검색·매치·Spotlight

- [x] 검색어·역할·상태·목적 필터
- [x] 최신순·노트순·도움순 API 계약
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

- [x] Debug 개발 API와 Release 운영 API 자동 분리
- [x] 로그인·필수 약관 동의·온보딩 API 연결
- [ ] 로컬 ProjectRepository를 API 구현으로 교체
- [ ] 캐시·페이지네이션·오류 — 액세스 401 자동 갱신과 리프레시 실패 로그아웃 완료
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

- 보조 역할 최대 2개와 주 역할 중복 금지는 단순 DB 제약으로 완전히 표현할 수 없어 프로필 저장 서비스의 트랜잭션에서 검증한다.
- 프로젝트 제목은 50자, 한 줄 소개는 120자, 이야기는 5000자로 서버 최대 길이를 확정했다.
- 개발 중 프로젝트는 링크·외부 아이콘·이미지를 저장하지 않으며 출시 프로젝트의 외부 URL은 HTTPS만 허용한다.
- 프로젝트 수정 배열은 부분 추가가 아니라 전달한 목록 전체 교체이며, 생략한 필드는 기존 값을 유지한다.
- 소프트 삭제는 두 번째 삭제 요청을 성공으로 위장하지 않고 `PROJECT_DELETED` 410으로 구분한다.
- 공개 상세 조회는 액세스 토큰 없이 허용하지만 프로젝트 생성·수정·삭제는 Bearer 인증을 유지한다.
- 프로젝트 상세 조회만으로 조회 수를 올리지 않으며 조회 수 정책 확정 전까지 0으로 반환한다.
- 목록 커서는 클라이언트가 내용을 해석하거나 수정하지 않는 불투명 문자열이며 생성 시각과 숫자 ID를 함께 사용한다.
- 목록 응답은 상세 이야기·전체 이미지·실제 공개 URL을 제외하고 카드에 필요한 대표 정보만 반환한다.
- 목록 커서는 검색어·역할·상태·목적·정렬 범위에 묶여 다른 조건으로 재사용할 수 없다.
- 잇커스 노트순·도움순은 API 값만 먼저 확정했으며 실제 DB 집계를 프로젝트 조회에 연결하기 전까지 최신순으로 동작한다.
- 사용자를 물리 삭제하려면 먼저 작성 프로젝트 처리 정책을 적용해야 하므로 `ProjectPost.authorId`는 `ON DELETE RESTRICT`를 사용한다.
- 닉네임과 주 역할은 소셜 로그인 직후 온보딩 전 상태 때문에 DB에서 `NULL`을 허용한다. 가입 완료 처리에서는 반드시 값과 길이를 검증한다.
- 기존 사용자도 필수 약관 동의 시각이 없으면 다음 로그인에서 `AUTH_CONSENT_REQUIRED` 428을 받아 한 번 동의 화면을 거친다.
- 액세스 JWT는 1시간이며 리프레시 세션은 정상 갱신할 때마다 90일로 연장한다. DB에는 리프레시 원문 대신 SHA-256 해시만 저장한다.
- 리프레시 토큰은 한 번 사용하면 즉시 폐기하고 새 토큰으로 교체한다. 폐기된 토큰 재사용 시 같은 계보의 활성 세션을 전부 폐기한다.
- 현재 동의 화면의 법적 문서 본문은 출시 전 교체해야 하는 안내문이며, 정식 본문과 개정 버전 정책은 운영 기능 단계에서 확정한다.
- 한 사용자는 같은 프로젝트에 활성 노트를 하나만 남기며 DB의 `(projectId, authorId)` 고유 제약은 삭제된 행도 포함한다. 삭제 뒤 다시 작성하면 기존 행을 새 내용으로 복원하고 도움 표시는 초기화한다.
- 조회 수 증가와 중복 방지 정책을 확정하기 전에는 단순 요청마다 카운트를 올리지 않는다.
- 운영 DB에는 `db push`나 `migrate dev`를 실행하지 않는다.
- 2.0에는 프로젝트 이미지 직접 업로드를 추가하지 않는다.
- `npm audit --omit=dev`는 Prisma 6 도구 체인의 `deepmerge-ts` 관련 high 3건을 보고한다. 자동 수정은 Prisma 7 메이저 업그레이드이므로 호환성 검증 없이 적용하지 않는다.
- Apple 성공 로그인은 실제 Sign in with Apple capability와 기기 토큰이 필요하고, Kakao 성공 로그인은 Kakao Developers 앱 키와 OpenID Connect 설정이 필요하다. 현재 자동 테스트는 서명 검증 이후 claim 처리와 로그인 분기를 mock으로 검증한다.
