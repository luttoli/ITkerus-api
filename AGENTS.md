# ITkerus 서버 공동 개발 규칙

이 저장소는 ITkerus iOS 앱의 NestJS API 서버다.

## 작업 전 확인

1. 이 파일을 끝까지 읽는다.
2. `README.md`에서 개발·운영 환경 분리 방식을 확인한다.
3. Git 상태와 최근 커밋을 확인한다.
4. `prisma/schema.prisma`와 작업 대상 코드를 확인한다.

## 기술 기준

- 언어는 TypeScript, API 프레임워크는 NestJS를 사용한다.
- 데이터 접근은 Prisma, 데이터베이스는 MariaDB를 사용한다.
- 개발 환경은 맥북의 `itkerus_dev`, 운영 환경은 맥미니의 `itkerus_prod`를 사용한다.
- 개발과 운영은 같은 코드를 사용하고 환경변수와 데이터베이스만 분리한다.
- `.env.development`와 `.env.production`은 Git에 추가하지 않는다.
- 운영 DB에는 `prisma migrate deploy`만 사용한다. `db push`와 `migrate dev`를 실행하지 않는다.
- Supabase와 Vapor를 추가하지 않는다.
- 사용자가 요청하지 않은 Git commit, push, pull은 실행하지 않는다.
