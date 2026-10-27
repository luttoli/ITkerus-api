import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ITkerusRole,
  Prisma,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const findUnique = jest.fn();
  let capturedCreateInput: Prisma.ProjectPostCreateArgs | undefined;
  const create =
    jest.fn<(input: Prisma.ProjectPostCreateArgs) => Promise<unknown>>();
  const prisma = {
    user: { findUnique },
    projectPost: { create },
  } as unknown as PrismaService;
  const service = new ProjectsService(prisma);
  const request: CreateProjectDto = {
    title: '냉장고컷',
    summary: '냉장고 속 재료로 요리를 추천하는 앱',
    story: '',
    status: ProjectStatus.RELEASED,
    purposes: [ProjectPurpose.INTRODUCTION, ProjectPurpose.QUESTION],
    itkerusFocus: '첫 사용자도 재료 등록을 이해할 수 있을까요?',
    requestedRoles: [ITkerusRole.DESIGNER],
    iconUrl: 'https://example.com/icon.png',
    links: [
      {
        type: ProjectLinkType.APP_STORE,
        url: 'https://apps.apple.com/app/id123456789',
      },
    ],
    imageUrls: ['https://example.com/screenshot.png'],
    selectedImageUrl: 'https://example.com/screenshot.png',
  };
  const storedProject = {
    id: 10,
    authorId: 1,
    title: request.title,
    summary: request.summary,
    story: '',
    status: request.status,
    itkerusFocus: request.itkerusFocus ?? null,
    iconUrl: request.iconUrl ?? null,
    selectedImageUrl: request.selectedImageUrl ?? null,
    createdAt: new Date('2026-10-23T00:00:00.000Z'),
    updatedAt: new Date('2026-10-23T00:00:00.000Z'),
    purposes: request.purposes.map((purpose) => ({ purpose })),
    requestedRoles: request.requestedRoles.map((role) => ({ role })),
    links: [{ id: 100, ...request.links[0] }],
    images: request.imageUrls.map((url) => ({ url })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findUnique.mockResolvedValue({ isOnboardingCompleted: true });
    create.mockImplementation((input: Prisma.ProjectPostCreateArgs) => {
      capturedCreateInput = input;
      return Promise.resolve(storedProject);
    });
  });

  it('creates all project relations for the authenticated author', async () => {
    await expect(service.createProject(1, request)).resolves.toEqual(
      expect.objectContaining({
        id: 10,
        authorId: 1,
        purposes: request.purposes,
        requestedRoles: request.requestedRoles,
        imageUrls: request.imageUrls,
        viewCount: 0,
        itkerusNoteCount: 0,
        helpedCount: 0,
      }),
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(capturedCreateInput?.data).toEqual(
      expect.objectContaining({
        authorId: 1,
        purposes: {
          create: request.purposes.map((purpose) => ({ purpose })),
        },
        requestedRoles: {
          create: request.requestedRoles.map((role) => ({ role })),
        },
        links: {
          create: [expect.objectContaining({ position: 0 })],
        },
        images: {
          create: [expect.objectContaining({ position: 0 })],
        },
      }),
    );
  });

  it('rejects QUESTION without ITkerus FOCUS', async () => {
    await expectHttpError(
      service.createProject(1, {
        ...request,
        itkerusFocus: ' ',
      }),
      BadRequestException,
      'PROJECT_FOCUS_REQUIRED',
    );
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects released projects without a public link', async () => {
    await expectHttpError(
      service.createProject(1, { ...request, links: [] }),
      BadRequestException,
      'PROJECT_RELEASE_LINK_REQUIRED',
    );
  });

  it('rejects external media for an in-development project', async () => {
    await expectHttpError(
      service.createProject(1, {
        ...request,
        status: ProjectStatus.IN_DEVELOPMENT,
      }),
      BadRequestException,
      'PROJECT_DEVELOPMENT_MEDIA_NOT_ALLOWED',
    );
  });

  it('rejects a representative image outside the registered image list', async () => {
    await expectHttpError(
      service.createProject(1, {
        ...request,
        selectedImageUrl: 'https://example.com/other.png',
      }),
      BadRequestException,
      'PROJECT_SELECTED_IMAGE_INVALID',
    );
  });

  it('returns 401 when the token user no longer exists', async () => {
    findUnique.mockResolvedValue(null);

    await expectHttpError(
      service.createProject(99, request),
      UnauthorizedException,
      'AUTH_USER_NOT_FOUND',
    );
  });

  it('requires onboarding before a project can be created', async () => {
    findUnique.mockResolvedValue({ isOnboardingCompleted: false });

    await expectHttpError(
      service.createProject(1, request),
      ForbiddenException,
      'PROJECT_PROFILE_REQUIRED',
    );
  });
});

async function expectHttpError(
  promise: Promise<unknown>,
  exceptionType:
    | typeof BadRequestException
    | typeof ForbiddenException
    | typeof UnauthorizedException,
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
          BadRequestException | ForbiddenException | UnauthorizedException
      ).getResponse(),
    ).toEqual(expect.objectContaining({ code: expectedCode }));
  }
}
