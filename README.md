# ITkerus API

ITkerus iOS 앱을 위한 NestJS API 서버다. TypeScript, NestJS, Prisma와 MariaDB를 사용한다.

## 환경 구성

서버 코드는 한 벌만 유지하고 실행 환경을 분리한다.

| 환경 | 실행 위치 | 환경 파일 | 데이터베이스 | DB 계정 |
|---|---|---|---|---|
| 개발 | 맥북 | `.env.development` | `itkerus_dev` | `itkerus_dev_app` |
| 운영 | 맥미니 | `.env.production` | `itkerus_prod` | `itkerus_prod_app` |

두 데이터베이스는 서로 다른 기기의 MariaDB에 있으므로 DBeaver에서도 맥북 개발 연결과 맥미니 운영 연결로 따로 보인다.

## 개발 환경 시작

```bash
cp .env.development.example .env.development
npm install
npm run prisma:generate
npm run start:dev
```

기본 주소는 `http://localhost:3100/api/v1/health`다.

## Prisma 명령

개발 중 스키마 변경과 마이그레이션 생성:

```bash
npm run prisma:migrate:dev -- --name 작업이름
```

개발 DB 확인:

```bash
npm run prisma:studio:dev
```

운영 배포 시 이미 생성된 마이그레이션만 적용:

```bash
npm run prisma:migrate:prod
```

운영 DB에서 `prisma db push` 또는 `prisma migrate dev`를 실행하지 않는다.

## 운영 배포 기본 흐름

맥미니에서 저장소를 받은 뒤 `.env.production.example`을 참고해 Git에 포함되지 않는 `.env.production`을 만든다.

```bash
npm ci
npm run prisma:generate
npm run build
npm run prisma:migrate:prod
npm run start:prod
```

프로세스 상시 실행, HTTPS 도메인, 자동 재시작과 백업은 배포 단계에서 별도로 구성한다.
