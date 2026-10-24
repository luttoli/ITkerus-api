import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import {
  ITkerusRole,
  Prisma,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService project update and deletion', () => {
  const findUnique = jest.fn();
  let capturedUpdateInput: Prisma.ProjectPostUpdateArgs | undefined;
  const update =
    jest.fn<(input: Prisma.ProjectPostUpdateArgs) => Promise<unknown>>();
  const prisma = {
    projectPost: { findUnique, update },
  } as unknown as PrismaService;
  const service = new ProjectsService(prisma);
  const storedProject = {
    id: 'project-id',
    authorId: 'user-id',
    title: '냉장고컷',
    summary: '냉장고 속 재료로 요리를 추천하는 앱',
    story: '',
    status: ProjectStatus.RELEASED,
    itkerusFocus: null,
    iconUrl: 'https://example.com/icon.png',
    selectedImageUrl: null,
    deletedAt: null,
    createdAt: new Date('2026-10-23T00:00:00.000Z'),
    updatedAt: new Date('2026-10-23T00:00:00.000Z'),
    purposes: [{ purpose: ProjectPurpose.INTRODUCTION }],
    requestedRoles: [{ role: ITkerusRole.DESIGNER }],
    links: [
      {
        id: 'link-id',
        type: ProjectLinkType.APP_STORE,
        url: 'https://apps.apple.com/app/id123456789',
      },
    ],
    images: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedUpdateInput = undefined;
    findUnique.mockResolvedValue(storedProject);
    update.mockImplementation((input: Prisma.ProjectPostUpdateArgs) => {
      capturedUpdateInput = input;
      return Promise.resolve({
        ...storedProject,
        title: '새 프로젝트 이름',
        status: ProjectStatus.IN_DEVELOPMENT,
        iconUrl: null,
        links: [],
      });
    });
  });

  it('updates scalar fields and replaces all child relations atomically', async () => {
    await expect(
      service.updateProject('user-id', 'project-id', {
        title: '새 프로젝트 이름',
        status: ProjectStatus.IN_DEVELOPMENT,
        iconUrl: null,
        links: [],
        imageUrls: [],
        selectedImageUrl: null,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        title: '새 프로젝트 이름',
        status: ProjectStatus.IN_DEVELOPMENT,
        iconUrl: null,
        links: [],
      }),
    );
    expect(capturedUpdateInput?.where).toEqual({
      id: 'project-id',
      authorId: 'user-id',
      deletedAt: null,
    });
    expect(capturedUpdateInput?.data).toEqual(
      expect.objectContaining({
        title: '새 프로젝트 이름',
        purposes: {
          deleteMany: {},
          create: [{ purpose: ProjectPurpose.INTRODUCTION }],
        },
        requestedRoles: {
          deleteMany: {},
          create: [{ role: ITkerusRole.DESIGNER }],
        },
        links: { deleteMany: {}, create: [] },
        images: { deleteMany: {}, create: [] },
      }),
    );
  });

  it('rejects an empty update body', async () => {
    await expectHttpError(
      service.updateProject('user-id', 'project-id', {}),
      BadRequestException,
      'PROJECT_UPDATE_EMPTY',
    );
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('validates the merged final project state', async () => {
    await expectHttpError(
      service.updateProject('user-id', 'project-id', {
        purposes: [ProjectPurpose.QUESTION],
      }),
      BadRequestException,
      'PROJECT_FOCUS_REQUIRED',
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing project', async () => {
    findUnique.mockResolvedValue(null);

    await expectHttpError(
      service.updateProject('user-id', 'missing-id', { title: '새 이름' }),
      NotFoundException,
      'PROJECT_NOT_FOUND',
    );
  });

  it('returns 403 when a different user tries to update', async () => {
    await expectHttpError(
      service.updateProject('other-user-id', 'project-id', {
        title: '새 이름',
      }),
      ForbiddenException,
      'PROJECT_FORBIDDEN',
    );
  });

  it('returns 410 when an already deleted project is updated', async () => {
    findUnique.mockResolvedValue({
      ...storedProject,
      deletedAt: new Date('2026-10-25T00:00:00.000Z'),
    });

    await expectHttpError(
      service.updateProject('user-id', 'project-id', { title: '새 이름' }),
      GoneException,
      'PROJECT_DELETED',
    );
  });

  it('returns 410 when the project is deleted during an update', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.19.3',
      }),
    );

    await expectHttpError(
      service.updateProject('user-id', 'project-id', { title: '새 이름' }),
      GoneException,
      'PROJECT_DELETED',
    );
  });

  it('soft deletes an owned active project', async () => {
    await expect(
      service.deleteProject('user-id', 'project-id'),
    ).resolves.toBeUndefined();
    expect(capturedUpdateInput?.where).toEqual({
      id: 'project-id',
      authorId: 'user-id',
      deletedAt: null,
    });
    const deletedAt = (
      capturedUpdateInput?.data as { deletedAt?: unknown } | undefined
    )?.deletedAt;
    expect(deletedAt).toBeInstanceOf(Date);
  });

  it('returns 410 when an already deleted project is deleted again', async () => {
    findUnique.mockResolvedValue({
      ...storedProject,
      deletedAt: new Date('2026-10-25T00:00:00.000Z'),
    });

    await expectHttpError(
      service.deleteProject('user-id', 'project-id'),
      GoneException,
      'PROJECT_DELETED',
    );
  });
});

async function expectHttpError(
  promise: Promise<unknown>,
  exceptionType:
    | typeof BadRequestException
    | typeof ForbiddenException
    | typeof GoneException
    | typeof NotFoundException,
  expectedCode: string,
) {
  try {
    await promise;
    throw new Error('Expected an HTTP exception.');
  } catch (error) {
    expect(error).toBeInstanceOf(exceptionType);
    expect(
      (
        error as
          | BadRequestException
          | ForbiddenException
          | GoneException
          | NotFoundException
      ).getResponse(),
    ).toEqual(expect.objectContaining({ code: expectedCode }));
  }
}
