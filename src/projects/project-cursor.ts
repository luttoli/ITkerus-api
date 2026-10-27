import {
  createProjectBadRequestException,
  ProjectsErrorCode,
} from './projects-error';

export type ProjectCursor = {
  createdAt: Date;
  id: number;
  scope: string;
};

type SerializedProjectCursor = {
  createdAt: string;
  id: number;
  scope: string;
};

export function encodeProjectCursor(cursor: ProjectCursor): string {
  const serialized: SerializedProjectCursor = {
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
    scope: cursor.scope,
  };

  return Buffer.from(JSON.stringify(serialized), 'utf8').toString('base64url');
}

export function decodeProjectCursor(
  cursor: string,
  expectedScope: string,
): ProjectCursor {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as unknown;

    if (!isSerializedProjectCursor(parsed)) {
      throw new Error('Invalid project cursor shape.');
    }

    const createdAt = new Date(parsed.createdAt);
    if (
      Number.isNaN(createdAt.getTime()) ||
      createdAt.toISOString() !== parsed.createdAt ||
      !Number.isSafeInteger(parsed.id) ||
      parsed.id <= 0 ||
      parsed.scope !== expectedScope
    ) {
      throw new Error('Invalid project cursor values.');
    }

    return { createdAt, id: parsed.id, scope: parsed.scope };
  } catch {
    throw createProjectBadRequestException(
      ProjectsErrorCode.cursorInvalid,
      '프로젝트 목록 커서가 올바르지 않습니다.',
    );
  }
}

function isSerializedProjectCursor(
  value: unknown,
): value is SerializedProjectCursor {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.createdAt === 'string' &&
    typeof record.id === 'number' &&
    typeof record.scope === 'string'
  );
}
