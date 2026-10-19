# ITkerus API 현재 상태

이 문서는 과거 작업 일지를 쌓지 않고 현재 구현 상태, 검증 결과, 남은 문제와 바로 다음 작업을 유지한다.

## 1. 현재 기준

- 확인일: 2026-10-20
- 작업 PC: 맥북
- 브랜치: `main`
- 원격 저장소: `github.com/luttoli/ITkerus-api`
- 마지막 커밋: `19c3492 [feat] [docs] 서버 설계와 전체 구현 체크리스트 정리 / 개발 DB 연결과 health 검증 구성 / 2.0.22`
- 앱 공개 버전: `2.0.22`
- 서버 패키지 버전: `0.0.1`

## 2. 현재 구현 상태

- [x] NestJS 11·TypeScript 프로젝트와 `/api/v1` 기본 경로
- [x] Prisma 6·MariaDB datasource와 전역 Prisma Module
- [x] 맥북 `.env.development`와 Mac mini `.env.production` 실행·마이그레이션 명령 분리
- [x] 맥북 공용 MariaDB의 `itkerus_dev`, `itkerus_dev_shadow`와 전용 `itkerus_dev_app` 계정
- [x] 실제 DB 연결을 확인하는 `GET /api/v1/health`
- [x] `User`, `SocialAccount`, `UserSecondaryRole` 최초 Prisma 스키마
- [x] 공개 UUID, 닉네임 고유 제약, Apple·Kakao 제공자 식별자 복합 고유 제약
- [x] 주 역할 6종 enum과 보조 역할 중복 방지 관계
- [x] 사용자 삭제 시 소셜 계정·보조 역할 `CASCADE` 삭제
- [x] 온보딩 전 사용자와 가입 완료 상태를 구분하는 `isOnboardingCompleted`
- [x] 실제 테이블·컬럼의 한국어 Comment 자동 적용과 누락 검사 명령
- [x] 첫 개발 마이그레이션 `20261019162754_add_user_accounts_and_roles`

## 3. 검증 상태

확인 완료:

- 첫 마이그레이션을 `itkerus_dev`에 생성·적용하고 Prisma Client 생성
- `User`, `SocialAccount`, `UserSecondaryRole` 테이블과 모든 컬럼의 한국어 Comment
- 닉네임, 제공자 식별자, 사용자별 제공자, 사용자별 보조 역할 고유 인덱스
- 사용자 관계의 외래키와 `ON DELETE CASCADE`
- `npm run build`
- `npm test -- --runInBand` 2개 통과

사용자 확인 항목:

- DBeaver에서 `itkerus_dev`의 세 테이블, 관계와 Comment를 화면으로 확인

아직 확인하지 않음:

- Mac mini 운영 컨테이너와 `itkerus_prod` 연결
- 운영 환경의 `migrate deploy`와 Comment 명령

## 4. 바로 다음 작업

JWT 기반 자체 세션의 공통 기반을 만든다.

- [ ] JWT 필수 환경변수와 만료 시간 검증
- [ ] 액세스 토큰 발급·검증 서비스
- [ ] `Authorization: Bearer` 공통 인증 Guard
- [ ] 인증 사용자 ID를 Controller에 전달하는 데코레이터
- [ ] 토큰 없음·변조·만료에 대한 401과 안정적인 오류 코드 테스트

그다음 Apple·Kakao 토큰 검증과 신규·기존 사용자 분기를 연결한다.

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
- [ ] JWT 발급·검증 Guard
- [ ] Apple ID 토큰 검증
- [ ] Kakao ID 토큰 검증
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

- 보조 역할 최대 2개와 주 역할 중복 금지는 단순 DB 제약으로 완전히 표현할 수 없어 프로필 저장 서비스의 트랜잭션에서 검증한다.
- 닉네임과 주 역할은 소셜 로그인 직후 온보딩 전 상태 때문에 DB에서 `NULL`을 허용한다. 가입 완료 처리에서는 반드시 값과 길이를 검증한다.
- 한 사용자가 같은 프로젝트에 잇커스 노트를 여러 개 남길 수 있는지 확정해야 한다.
- 조회 수 증가와 중복 방지 정책을 확정하기 전에는 단순 요청마다 카운트를 올리지 않는다.
- 운영 DB에는 `db push`나 `migrate dev`를 실행하지 않는다.
- 2.0에는 프로젝트 이미지 직접 업로드를 추가하지 않는다.
