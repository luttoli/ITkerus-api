import {
  createProjectBadRequestException,
  ProjectsErrorCode,
} from './projects-error';

export type ProjectCursor = {
  createdAt: Date;
  id: string;
};

type SerializedProjectCursor = {
  createdAt: string;
  id: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function encodeProjectCursor(cursor: ProjectCursor): string {
  const serialized: SerializedProjectCursor = {
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
  };

  return Buffer.from(JSON.stringify(serialized), 'utf8').toString('base64url');
}

export function decodeProjectCursor(cursor: string): ProjectCursor {
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
      !uuidPattern.test(parsed.id)
    ) {
      throw new Error('Invalid project cursor values.');
    }

    return { createdAt, id: parsed.id };
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
  return typeof record.createdAt === 'string' && typeof record.id === 'string';
}
