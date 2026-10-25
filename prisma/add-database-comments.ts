import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TableDescription = {
  description: string;
  columns: Record<string, string>;
};

// Prisma 스키마에 실제 테이블이나 컬럼을 추가하면 같은 작업에서 설명도 함께 추가한다.
const descriptions: Record<string, TableDescription> = {
  User: {
    description: 'ITkerus 사용자 계정과 공개 프로필',
    columns: {
      id: '사용자 공개 UUID',
      nickname: '온보딩에서 정하는 2~10자 고유 닉네임',
      introduction: '최대 60자의 선택 한 줄 소개',
      primaryRole: '사용자의 주 역할',
      isOnboardingCompleted: '닉네임과 역할 설정을 마친 가입 완료 여부',
      termsAcceptedAt: '필수 이용약관에 동의한 일시(UTC)',
      privacyAcceptedAt: '필수 개인정보 처리방침에 동의한 일시(UTC)',
      createdAt: '사용자 생성 일시(UTC)',
      updatedAt: '사용자 마지막 수정 일시(UTC)',
    },
  },
  SocialAccount: {
    description: 'Apple 또는 Kakao 검증 계정과 사용자의 연결',
    columns: {
      id: '소셜 계정 연결 UUID',
      provider: '로그인 제공자(APPLE 또는 KAKAO)',
      providerUserId: '제공자가 검증해 발급한 사용자 고유 식별자',
      userId: '연결된 User.id',
      createdAt: '소셜 계정 연결 일시(UTC)',
    },
  },
  UserSecondaryRole: {
    description: '사용자가 선택한 최대 두 개의 보조 역할',
    columns: {
      id: '보조 역할 행 UUID',
      userId: '보조 역할을 소유한 User.id',
      role: '사용자의 보조 역할',
      createdAt: '보조 역할 생성 일시(UTC)',
    },
  },
  ProjectPost: {
    description: '사용자가 공개한 프로젝트 소개와 고민',
    columns: {
      id: '프로젝트 공개 UUID',
      authorId: '프로젝트를 작성한 User.id',
      title: '최대 50자의 프로젝트 이름',
      summary: '최대 120자의 한 줄 소개',
      story: '최대 5000자의 프로젝트 이야기',
      status: '프로젝트 상태(IN_DEVELOPMENT 또는 RELEASED)',
      itkerusFocus: '최대 150자의 집중 피드백 요청 내용',
      iconUrl: '출시 서비스에서 가져온 외부 아이콘 HTTPS URL',
      selectedImageUrl: '대표로 선택한 외부 이미지 HTTPS URL',
      deletedAt: '소프트 삭제 일시(UTC), 미삭제 시 NULL',
      createdAt: '프로젝트 생성 일시(UTC)',
      updatedAt: '프로젝트 마지막 수정 일시(UTC)',
    },
  },
  ProjectPostPurpose: {
    description: '프로젝트가 소개 또는 고민 공유인지 나타내는 목적',
    columns: {
      projectId: '목적이 연결된 ProjectPost.id',
      purpose: '프로젝트 목적(INTRODUCTION 또는 QUESTION)',
      createdAt: '프로젝트 목적 생성 일시(UTC)',
    },
  },
  ProjectRequestedRole: {
    description: '프로젝트 작성자가 의견을 요청한 사용자 역할',
    columns: {
      projectId: '요청 역할이 연결된 ProjectPost.id',
      role: '의견을 요청한 ITkerus 역할',
      createdAt: '요청 역할 생성 일시(UTC)',
    },
  },
  ProjectLink: {
    description: '출시 프로젝트의 App Store, Google Play 또는 Web 공개 링크',
    columns: {
      id: '프로젝트 링크 공개 UUID',
      projectId: '링크가 연결된 ProjectPost.id',
      type: '공개 링크 종류(APP_STORE, GOOGLE_PLAY 또는 WEB)',
      url: '사용자가 접근할 수 있는 공개 HTTPS URL',
      position: '프로젝트 안에서 링크를 표시할 순서',
      createdAt: '프로젝트 링크 생성 일시(UTC)',
    },
  },
  ProjectImage: {
    description: '출시 프로젝트에서 선택 가능한 외부 소개 이미지',
    columns: {
      id: '프로젝트 이미지 공개 UUID',
      projectId: '이미지가 연결된 ProjectPost.id',
      url: '스토어 등 외부 원본의 HTTPS 이미지 URL',
      position: '프로젝트 안에서 이미지를 표시할 순서',
      createdAt: '프로젝트 이미지 생성 일시(UTC)',
    },
  },
  ITkerusNote: {
    description: '사용자가 프로젝트를 살펴보고 남긴 잇커스 노트',
    columns: {
      id: '잇커스 노트 공개 UUID',
      projectId: '노트가 작성된 ProjectPost.id',
      authorId: '노트를 작성한 User.id',
      authorRole: '노트 작성 당시 사용자의 주 역할',
      content: '앞뒤 공백 제거 후 최대 600자의 의견',
      didTryProject: '작성자가 프로젝트를 직접 사용하거나 살펴봤는지 여부',
      isMarkedHelpful: '프로젝트 작성자가 도움됐어요로 표시했는지 여부',
      deletedAt: '소프트 삭제 일시(UTC), 미삭제 시 NULL',
      createdAt: '잇커스 노트 생성 일시(UTC)',
      updatedAt: '잇커스 노트 마지막 수정 일시(UTC)',
    },
  },
};

async function main() {
  await validateDescriptionCoverage();

  for (const [table, tableDescription] of Object.entries(descriptions)) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${table}\` COMMENT = '${escapeComment(tableDescription.description)}'`,
    );

    const definitions = await getColumnDefinitions(table);
    for (const [column, comment] of Object.entries(tableDescription.columns)) {
      const definition = definitions.get(column);
      if (!definition) {
        throw new Error(`${table}.${column} 컬럼을 찾을 수 없습니다.`);
      }

      const sql = `ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${insertComment(definition, comment)}`;
      await prisma.$executeRawUnsafe(sql);
    }

    console.log(`완료: ${table}`);
  }
}

// 새 테이블이나 컬럼의 설명을 빠뜨리면 일부만 반영하지 않고 먼저 실패한다.
async function validateDescriptionCoverage() {
  const databaseTables = await getDatabaseTables();
  const missingDescriptions: string[] = [];

  for (const table of databaseTables) {
    if (table.startsWith('_')) {
      continue;
    }

    const tableDescription = descriptions[table];
    if (!tableDescription) {
      missingDescriptions.push(`${table} 테이블`);
      continue;
    }

    const definitions = await getColumnDefinitions(table);
    for (const column of definitions.keys()) {
      if (!tableDescription.columns[column]) {
        missingDescriptions.push(`${table}.${column}`);
      }
    }
  }

  if (missingDescriptions.length > 0) {
    throw new Error(
      `DB 설명 누락:\n- ${missingDescriptions.join('\n- ')}\n` +
        'prisma/add-database-comments.ts의 descriptions를 먼저 갱신하세요.',
    );
  }
}

async function getDatabaseTables(): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<{ tableName: string }[]>(
    `SELECT TABLE_NAME AS tableName
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_TYPE = 'BASE TABLE'`,
  );

  return rows.map((row) => row.tableName);
}

// MariaDB가 만든 유효한 컬럼 정의를 그대로 사용하고 COMMENT 부분만 교체한다.
async function getColumnDefinitions(
  table: string,
): Promise<Map<string, string>> {
  const rows = await prisma.$queryRawUnsafe<{ 'Create Table': string }[]>(
    `SHOW CREATE TABLE \`${table}\``,
  );
  const createTableSql = rows[0]?.['Create Table'];
  if (!createTableSql) {
    throw new Error(`SHOW CREATE TABLE 결과를 읽을 수 없습니다: ${table}`);
  }

  const definitions = new Map<string, string>();
  for (const line of createTableSql.split('\n')) {
    const match = line.trim().match(/^`(\w+)`\s+(.+?),?$/);
    if (match) {
      definitions.set(match[1], match[2]);
    }
  }

  return definitions;
}

function insertComment(definition: string, comment: string): string {
  const withoutOldComment = definition.replace(
    /\s*COMMENT\s+'(?:[^']|'')*'/i,
    '',
  );
  const escaped = escapeComment(comment);
  const checkClause = withoutOldComment.match(/\sCHECK\s*\(/i);

  if (checkClause?.index !== undefined) {
    const before = withoutOldComment.slice(0, checkClause.index);
    const check = withoutOldComment.slice(checkClause.index).trim();
    return `${before} COMMENT '${escaped}' ${check}`;
  }

  return `${withoutOldComment} COMMENT '${escaped}'`;
}

function escapeComment(text: string): string {
  return text.replace(/'/g, "''");
}

main()
  .then(async () => {
    console.log('DB 테이블·컬럼 설명 반영 완료');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
