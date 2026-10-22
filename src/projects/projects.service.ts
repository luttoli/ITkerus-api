import { Injectable } from '@nestjs/common';
import { Prisma, ProjectPurpose, ProjectStatus } from '@prisma/client';
import { AuthErrorCode, createUnauthorizedException } from '../auth/auth-error';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import {
  createProjectBadRequestException,
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

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private validateBusinessRules(request: CreateProjectDto) {
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
}
