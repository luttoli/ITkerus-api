import { Injectable } from '@nestjs/common';
import { Prisma, ProjectPurpose, ProjectStatus } from '@prisma/client';
import { AuthErrorCode, createUnauthorizedException } from '../auth/auth-error';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import {
  ProjectListItemResponseDto,
  ProjectListResponseDto,
} from './dto/project-list-response.dto';
import {
  ProjectDetailResponseDto,
  ProjectResponseDto,
} from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { decodeProjectCursor, encodeProjectCursor } from './project-cursor';
import {
  createProjectBadRequestException,
  createProjectDeletedException,
  createProjectForbiddenException,
  createProjectNotFoundException,
  createProjectProfileRequiredException,
  ProjectsErrorCode,
} from './projects-error';

const projectSelect = {
  id: true,
  authorId: true,
  title: true,
  summary: true,
  story: true,
  status: true,
  itkerusFocus: true,
  iconUrl: true,
  selectedImageUrl: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  purposes: {
    orderBy: { createdAt: 'asc' as const },
    select: { purpose: true },
  },
  requestedRoles: {
    orderBy: { createdAt: 'asc' as const },
    select: { role: true },
  },
  links: {
    orderBy: { position: 'asc' as const },
    select: { id: true, type: true, url: true },
  },
  images: {
    orderBy: { position: 'asc' as const },
    select: { url: true },
  },
} satisfies Prisma.ProjectPostSelect;

type ProjectResult = Prisma.ProjectPostGetPayload<{
  select: typeof projectSelect;
}>;

const projectDetailSelect = {
  ...projectSelect,
  author: {
    select: {
      id: true,
      nickname: true,
      primaryRole: true,
      secondaryRoles: {
        orderBy: { createdAt: 'asc' as const },
        select: { role: true },
      },
    },
  },
} satisfies Prisma.ProjectPostSelect;

type ProjectDetailResult = Prisma.ProjectPostGetPayload<{
  select: typeof projectDetailSelect;
}>;

const projectListSelect = {
  id: true,
  title: true,
  summary: true,
  status: true,
  itkerusFocus: true,
  iconUrl: true,
  selectedImageUrl: true,
  createdAt: true,
  purposes: {
    orderBy: { createdAt: 'asc' as const },
    select: { purpose: true },
  },
  requestedRoles: {
    orderBy: { createdAt: 'asc' as const },
    select: { role: true },
  },
  links: {
    orderBy: { position: 'asc' as const },
    select: { type: true },
  },
  author: {
    select: {
      id: true,
      nickname: true,
      primaryRole: true,
      secondaryRoles: {
        orderBy: { createdAt: 'asc' as const },
        select: { role: true },
      },
    },
  },
} satisfies Prisma.ProjectPostSelect;

type ProjectListResult = Prisma.ProjectPostGetPayload<{
  select: typeof projectListSelect;
}>;

type ProjectWriteValues = {
  title: string;
  summary: string;
  story?: string;
  status: ProjectStatus;
  purposes: ProjectPurpose[];
  itkerusFocus?: string | null;
  requestedRoles: CreateProjectDto['requestedRoles'];
  iconUrl?: string | null;
  links: CreateProjectDto['links'];
  imageUrls: string[];
  selectedImageUrl?: string | null;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjects(
    query: GetProjectsQueryDto,
  ): Promise<ProjectListResponseDto> {
    const cursor = query.cursor ? decodeProjectCursor(query.cursor) : undefined;
    const projects = await this.prisma.projectPost.findMany({
      where: {
        deletedAt: null,
        author: {
          is: {
            isOnboardingCompleted: true,
            nickname: { not: null },
            primaryRole: { not: null },
          },
        },
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                {
                  createdAt: cursor.createdAt,
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      select: projectListSelect,
    });
    const hasNextPage = projects.length > query.limit;
    const page = hasNextPage ? projects.slice(0, query.limit) : projects;
    const items: ProjectListItemResponseDto[] = [];

    for (const project of page) {
      const item = this.toListItemResponse(project);
      if (item) {
        items.push(item);
      }
    }

    const lastProject = page.at(-1);
    const nextCursor =
      hasNextPage && lastProject
        ? encodeProjectCursor({
            createdAt: lastProject.createdAt,
            id: lastProject.id,
          })
        : null;

    return { projects: items, nextCursor };
  }

  async getProject(projectId: string): Promise<ProjectDetailResponseDto> {
    const project = await this.prisma.projectPost.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: projectDetailSelect,
    });

    if (!project) {
      throw createProjectNotFoundException();
    }

    return this.toDetailResponse(project);
  }

  async createProject(
    userId: string,
    request: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    this.validateBusinessRules(request);

    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboardingCompleted: true },
    });

    if (!author) {
      throw createUnauthorizedException(
        AuthErrorCode.userNotFound,
        '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
      );
    }

    if (!author.isOnboardingCompleted) {
      throw createProjectProfileRequiredException();
    }

    const project = await this.prisma.projectPost.create({
      data: {
        authorId: userId,
        title: request.title,
        summary: request.summary,
        story: request.story || '',
        status: request.status,
        itkerusFocus: request.itkerusFocus || null,
        iconUrl: request.iconUrl ?? null,
        selectedImageUrl: request.selectedImageUrl ?? null,
        purposes: {
          create: request.purposes.map((purpose) => ({ purpose })),
        },
        requestedRoles: {
          create: request.requestedRoles.map((role) => ({ role })),
        },
        links: {
          create: request.links.map((link, position) => ({
            ...link,
            position,
          })),
        },
        images: {
          create: request.imageUrls.map((url, position) => ({
            url,
            position,
          })),
        },
      },
      select: projectSelect,
    });

    return this.toResponse(project);
  }

  async updateProject(
    userId: string,
    projectId: string,
    request: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    if (Object.keys(request).length === 0) {
      throw createProjectBadRequestException(
        ProjectsErrorCode.updateEmpty,
        '수정할 프로젝트 정보를 하나 이상 보내주세요.',
      );
    }

    const current = await this.findOwnedActiveProject(userId, projectId);
    const values = this.mergeProjectValues(current, request);
    this.validateBusinessRules(values);

    try {
      const project = await this.prisma.projectPost.update({
        where: {
          id: projectId,
          authorId: userId,
          deletedAt: null,
        },
        data: {
          title: values.title,
          summary: values.summary,
          story: values.story || '',
          status: values.status,
          itkerusFocus: values.itkerusFocus || null,
          iconUrl: values.iconUrl ?? null,
          selectedImageUrl: values.selectedImageUrl ?? null,
          purposes: {
            deleteMany: {},
            create: values.purposes.map((purpose) => ({ purpose })),
          },
          requestedRoles: {
            deleteMany: {},
            create: values.requestedRoles.map((role) => ({ role })),
          },
          links: {
            deleteMany: {},
            create: values.links.map((link, position) => ({
              ...link,
              position,
            })),
          },
          images: {
            deleteMany: {},
            create: values.imageUrls.map((url, position) => ({
              url,
              position,
            })),
          },
        },
        select: projectSelect,
      });

      return this.toResponse(project);
    } catch (error) {
      if (this.isRecordNotFoundError(error)) {
        throw createProjectDeletedException();
      }

      throw error;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    await this.findOwnedActiveProject(userId, projectId);

    try {
      await this.prisma.projectPost.update({
        where: {
          id: projectId,
          authorId: userId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
        select: { id: true },
      });
    } catch (error) {
      if (this.isRecordNotFoundError(error)) {
        throw createProjectDeletedException();
      }

      throw error;
    }
  }

  private async findOwnedActiveProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectResult> {
    const project = await this.prisma.projectPost.findUnique({
      where: { id: projectId },
      select: projectSelect,
    });

    if (!project) {
      throw createProjectNotFoundException();
    }

    if (project.authorId !== userId) {
      throw createProjectForbiddenException();
    }

    if (project.deletedAt) {
      throw createProjectDeletedException();
    }

    return project;
  }

  private mergeProjectValues(
    current: ProjectResult,
    request: UpdateProjectDto,
  ): ProjectWriteValues {
    return {
      title: request.title ?? current.title,
      summary: request.summary ?? current.summary,
      story: request.story ?? current.story,
      status: request.status ?? current.status,
      purposes:
        request.purposes ?? current.purposes.map(({ purpose }) => purpose),
      itkerusFocus:
        request.itkerusFocus === undefined
          ? current.itkerusFocus
          : request.itkerusFocus,
      requestedRoles:
        request.requestedRoles ??
        current.requestedRoles.map(({ role }) => role),
      iconUrl:
        request.iconUrl === undefined ? current.iconUrl : request.iconUrl,
      links:
        request.links ?? current.links.map(({ type, url }) => ({ type, url })),
      imageUrls: request.imageUrls ?? current.images.map(({ url }) => url),
      selectedImageUrl:
        request.selectedImageUrl === undefined
          ? current.selectedImageUrl
          : request.selectedImageUrl,
    };
  }

  private isRecordNotFoundError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }

  private validateBusinessRules(request: ProjectWriteValues) {
    const focus = request.itkerusFocus?.trim();
    if (request.purposes.includes(ProjectPurpose.QUESTION) && !focus) {
      throw createProjectBadRequestException(
        ProjectsErrorCode.focusRequired,
        '고민 있어요를 선택했다면 ITkerus FOCUS를 입력해주세요.',
      );
    }

    const linkTypes = request.links.map(({ type }) => type);
    if (new Set(linkTypes).size !== linkTypes.length) {
      throw createProjectBadRequestException(
        ProjectsErrorCode.duplicatedLinkType,
        '같은 종류의 공개 링크는 한 번만 등록할 수 있습니다.',
      );
    }

    if (request.status === ProjectStatus.IN_DEVELOPMENT) {
      if (
        request.links.length > 0 ||
        request.imageUrls.length > 0 ||
        request.iconUrl ||
        request.selectedImageUrl
      ) {
        throw createProjectBadRequestException(
          ProjectsErrorCode.developmentMediaNotAllowed,
          '개발 중 프로젝트에는 외부 링크나 이미지를 등록할 수 없습니다.',
        );
      }

      return;
    }

    if (request.links.length === 0) {
      throw createProjectBadRequestException(
        ProjectsErrorCode.releaseLinkRequired,
        '출시한 프로젝트에는 공개 링크가 하나 이상 필요합니다.',
      );
    }

    if (request.imageUrls.length > 0 && !request.selectedImageUrl) {
      throw createProjectBadRequestException(
        ProjectsErrorCode.selectedImageRequired,
        '외부 이미지가 있다면 대표 이미지를 선택해주세요.',
      );
    }

    if (
      request.selectedImageUrl &&
      !request.imageUrls.includes(request.selectedImageUrl)
    ) {
      throw createProjectBadRequestException(
        ProjectsErrorCode.selectedImageInvalid,
        '대표 이미지는 등록한 외부 이미지 중에서 선택해주세요.',
      );
    }
  }

  private toResponse(project: ProjectResult): ProjectResponseDto {
    return {
      id: project.id,
      authorId: project.authorId,
      title: project.title,
      summary: project.summary,
      story: project.story,
      status: project.status,
      purposes: project.purposes.map(({ purpose }) => purpose),
      itkerusFocus: project.itkerusFocus,
      requestedRoles: project.requestedRoles.map(({ role }) => role),
      iconUrl: project.iconUrl,
      links: project.links,
      imageUrls: project.images.map(({ url }) => url),
      selectedImageUrl: project.selectedImageUrl,
      viewCount: 0,
      itkerusNoteCount: 0,
      helpedCount: 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toDetailResponse(
    project: ProjectDetailResult,
  ): ProjectDetailResponseDto {
    const { nickname, primaryRole } = project.author;
    if (!nickname || !primaryRole) {
      throw createProjectNotFoundException();
    }

    const response = this.toResponse(project);

    return {
      ...response,
      author: {
        id: project.author.id,
        nickname,
        primaryRole,
        secondaryRoles: project.author.secondaryRoles.map(({ role }) => role),
      },
    };
  }

  private toListItemResponse(
    project: ProjectListResult,
  ): ProjectListItemResponseDto | null {
    const { nickname, primaryRole } = project.author;
    if (!nickname || !primaryRole) {
      return null;
    }

    return {
      id: project.id,
      title: project.title,
      summary: project.summary,
      status: project.status,
      purposes: project.purposes.map(({ purpose }) => purpose),
      itkerusFocus: project.itkerusFocus,
      requestedRoles: project.requestedRoles.map(({ role }) => role),
      iconUrl: project.iconUrl,
      selectedImageUrl: project.selectedImageUrl,
      linkTypes: project.links.map(({ type }) => type),
      itkerusNoteCount: 0,
      helpedCount: 0,
      createdAt: project.createdAt,
      author: {
        id: project.author.id,
        nickname,
        primaryRole,
        secondaryRoles: project.author.secondaryRoles.map(({ role }) => role),
      },
    };
  }
}
