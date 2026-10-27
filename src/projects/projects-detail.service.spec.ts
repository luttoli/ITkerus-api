import { NotFoundException } from '@nestjs/common';
import {
  ITkerusRole,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService project detail', () => {
  const findFirst = jest.fn();
  const prisma = {
    projectPost: { findFirst },
  } as unknown as PrismaService;
  const service = new ProjectsService(prisma);
  const storedProject = {
    id: 10,
    authorId: 1,
    title: '냉장고컷',
    summary: '냉장고 속 재료로 요리를 추천하는 앱',
    story: '남은 재료를 잊지 않도록 만들었어요.',
    status: ProjectStatus.RELEASED,
    itkerusFocus: '첫 사용자도 재료 등록을 이해할 수 있을까요?',
    iconUrl: 'https://example.com/icon.png',
    selectedImageUrl: 'https://example.com/screenshot.png',
    deletedAt: null,
    createdAt: new Date('2026-10-23T00:00:00.000Z'),
    updatedAt: new Date('2026-10-25T00:00:00.000Z'),
    purposes: [
      { purpose: ProjectPurpose.INTRODUCTION },
      { purpose: ProjectPurpose.QUESTION },
    ],
    requestedRoles: [{ role: ITkerusRole.DESIGNER }],
    links: [
      {
        id: 100,
        type: ProjectLinkType.APP_STORE,
        url: 'https://apps.apple.com/app/id123456789',
      },
    ],
    images: [{ url: 'https://example.com/screenshot.png' }],
    author: {
      id: 1,
      nickname: '세레나',
      primaryRole: ITkerusRole.DEVELOPER,
      secondaryRoles: [
        { role: ITkerusRole.DESIGNER },
        { role: ITkerusRole.PLANNER },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findFirst.mockResolvedValue(storedProject);
  });

  it('returns an active project with its public author profile', async () => {
    await expect(service.getProject(10)).resolves.toEqual({
      id: 10,
      authorId: 1,
      title: '냉장고컷',
      summary: '냉장고 속 재료로 요리를 추천하는 앱',
      story: '남은 재료를 잊지 않도록 만들었어요.',
      status: ProjectStatus.RELEASED,
      purposes: [ProjectPurpose.INTRODUCTION, ProjectPurpose.QUESTION],
      itkerusFocus: '첫 사용자도 재료 등록을 이해할 수 있을까요?',
      requestedRoles: [ITkerusRole.DESIGNER],
      iconUrl: 'https://example.com/icon.png',
      links: [
        {
          id: 100,
          type: ProjectLinkType.APP_STORE,
          url: 'https://apps.apple.com/app/id123456789',
        },
      ],
      imageUrls: ['https://example.com/screenshot.png'],
      selectedImageUrl: 'https://example.com/screenshot.png',
      viewCount: 0,
      itkerusNoteCount: 0,
      helpedCount: 0,
      createdAt: new Date('2026-10-23T00:00:00.000Z'),
      updatedAt: new Date('2026-10-25T00:00:00.000Z'),
      author: {
        id: 1,
        nickname: '세레나',
        primaryRole: ITkerusRole.DEVELOPER,
        secondaryRoles: [ITkerusRole.DESIGNER, ITkerusRole.PLANNER],
      },
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 10,
          deletedAt: null,
        },
      }),
    );
  });

  it('returns 404 when the project is missing or soft deleted', async () => {
    findFirst.mockResolvedValue(null);

    await expectNotFound(service.getProject(11));
  });

  it('does not expose a project whose author profile is incomplete', async () => {
    findFirst.mockResolvedValue({
      ...storedProject,
      author: {
        ...storedProject.author,
        nickname: null,
      },
    });

    await expectNotFound(service.getProject(10));
  });
});

async function expectNotFound(promise: Promise<unknown>) {
  try {
    await promise;
    throw new Error('Expected a NotFoundException.');
  } catch (error) {
    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toEqual({
      code: 'PROJECT_NOT_FOUND',
      message: '프로젝트를 찾을 수 없습니다.',
    });
  }
}
