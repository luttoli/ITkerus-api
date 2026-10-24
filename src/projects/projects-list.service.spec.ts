import { BadRequestException } from '@nestjs/common';
import {
  ITkerusRole,
  Prisma,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService project list', () => {
  let capturedFindManyInput: Prisma.ProjectPostFindManyArgs | undefined;
  const findMany =
    jest.fn<(input: Prisma.ProjectPostFindManyArgs) => Promise<unknown>>();
  const prisma = {
    projectPost: { findMany },
  } as unknown as PrismaService;
  const service = new ProjectsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    capturedFindManyInput = undefined;
  });

  it('returns a lightweight newest-first page without detail-only fields', async () => {
    findMany.mockImplementation((input: Prisma.ProjectPostFindManyArgs) => {
      capturedFindManyInput = input;
      return Promise.resolve([createStoredProject(1)]);
    });

    const response = await service.getProjects({ limit: 20 });

    expect(response.nextCursor).toBeNull();
    expect(response.projects).toHaveLength(1);
    expect(response.projects[0]).toEqual(
      expect.objectContaining({
        id: projectId(1),
        title: '프로젝트 1',
        linkTypes: [ProjectLinkType.WEB],
        itkerusNoteCount: 0,
        helpedCount: 0,
        author: {
          id: '11111111-1111-4111-8111-111111111111',
          nickname: '세레나',
          primaryRole: ITkerusRole.DEVELOPER,
          secondaryRoles: [ITkerusRole.DESIGNER],
        },
      }),
    );
    expect(response.projects[0]).not.toHaveProperty('story');
    expect(response.projects[0]).not.toHaveProperty('imageUrls');
    expect(response.projects[0]).not.toHaveProperty('links');
    expect(capturedFindManyInput).toEqual(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      }),
    );
    expect(capturedFindManyInput?.where).toEqual(
      expect.objectContaining({ deletedAt: null }),
    );
  });

  it('returns an opaque cursor and applies it to the next page', async () => {
    findMany.mockImplementation((input: Prisma.ProjectPostFindManyArgs) => {
      capturedFindManyInput = input;
      return Promise.resolve([
        createStoredProject(3),
        createStoredProject(2),
        createStoredProject(1),
      ]);
    });

    const firstPage = await service.getProjects({ limit: 2 });

    expect(firstPage.projects).toHaveLength(2);
    expect(firstPage.nextCursor).toEqual(expect.any(String));

    findMany.mockImplementation((input: Prisma.ProjectPostFindManyArgs) => {
      capturedFindManyInput = input;
      return Promise.resolve([]);
    });
    await service.getProjects({
      limit: 2,
      cursor: firstPage.nextCursor ?? undefined,
    });

    expect(capturedFindManyInput?.where).toEqual(
      expect.objectContaining({
        OR: [
          { createdAt: { lt: new Date('2026-10-25T00:00:02.000Z') } },
          {
            createdAt: new Date('2026-10-25T00:00:02.000Z'),
            id: { lt: projectId(2) },
          },
        ],
      }),
    );
  });

  it('returns 400 for a malformed cursor', async () => {
    await expectHttpError(
      service.getProjects({ limit: 20, cursor: 'not-a-project-cursor' }),
      'PROJECT_CURSOR_INVALID',
    );
    expect(findMany).not.toHaveBeenCalled();
  });
});

function createStoredProject(sequence: number) {
  return {
    id: projectId(sequence),
    title: `프로젝트 ${sequence}`,
    summary: '프로젝트 한 줄 소개',
    status: ProjectStatus.RELEASED,
    itkerusFocus: null,
    iconUrl: 'https://example.com/icon.png',
    selectedImageUrl: null,
    createdAt: new Date(`2026-10-25T00:00:0${sequence}.000Z`),
    purposes: [{ purpose: ProjectPurpose.INTRODUCTION }],
    requestedRoles: [{ role: ITkerusRole.DESIGNER }],
    links: [{ type: ProjectLinkType.WEB }],
    author: {
      id: '11111111-1111-4111-8111-111111111111',
      nickname: '세레나',
      primaryRole: ITkerusRole.DEVELOPER,
      secondaryRoles: [{ role: ITkerusRole.DESIGNER }],
    },
  };
}

function projectId(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
}

async function expectHttpError(
  promise: Promise<unknown>,
  expectedCode: string,
) {
  try {
    await promise;
    throw new Error('Expected a BadRequestException.');
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toEqual(
      expect.objectContaining({ code: expectedCode }),
    );
  }
}
