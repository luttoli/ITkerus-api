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
