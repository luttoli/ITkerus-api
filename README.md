# ITkerus API

ITkerus iOS 앱을 위한 NestJS API 서버다. TypeScript, NestJS, Prisma와 MariaDB를 사용한다.

## 문서

- `AGENTS.md`: AI와 개발자가 반드시 지킬 작업 규칙
- `docs/PROJECT.md`: 확정된 서버 설계, API·데이터 범위와 전체 로드맵
- `docs/STATUS.md`: 현재 구현 상태, 체크리스트와 바로 다음 작업

## 환경 구성

서버 코드는 한 벌만 유지하고 실행 환경을 분리한다.

| 환경 | 실행 위치 | 환경 파일 | 데이터베이스 | DB 계정 |
|---|---|---|---|---|
| 개발 | 맥북 | `.env.development` | `itkerus_dev` | `itkerus_dev_app` |
| 운영 | Mac mini | `.env.production` | `itkerus_prod` | `itkerus_prod_app` |

두 데이터베이스는 서로 다른 기기의 MariaDB에 있으므로 DBeaver에서도 맥북 개발 연결과 Mac mini 운영 연결로 따로 보인다.
개발 마이그레이션은 변경 비교를 위해 같은 계정의 `itkerus_dev_shadow` DB를 추가로 사용한다. 운영 배포는 이미 만들어진 마이그레이션만 적용하므로 shadow DB를 만들지 않는다.

## 개발 환경 시작

```bash
cp .env.development.example .env.development
npm install
npm run prisma:generate
npm run start:dev
```

기본 확인 주소는 `http://localhost:3100/api/v1/health`다.

## 개발 DB 변경

```bash
npm run prisma:migrate:dev -- --name 작업이름
npm run prisma:generate
```

개발 DB를 Prisma Studio로 확인하려면 다음 명령을 사용한다.

```bash
npm run prisma:studio:dev
```

운영 DB에는 개발 명령을 사용하지 않고 커밋된 마이그레이션만 적용한다.

```bash
npm run prisma:migrate:prod
```

## 운영 배포 기본 흐름

Mac mini에서 저장소를 받은 뒤 `.env.production.example`을 참고해 Git에 포함되지 않는 `.env.production`을 만든다.

```bash
npm ci
npm run prisma:generate
npm run build
npm run prisma:migrate:prod
npm run start:prod
```

Docker, HTTPS 도메인, 자동 재시작, 백업과 장애 알림은 `docs/PROJECT.md`의 운영 체크리스트를 따른다.
