import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';

export const ProjectsErrorCode = {
  profileRequired: 'PROJECT_PROFILE_REQUIRED',
  focusRequired: 'PROJECT_FOCUS_REQUIRED',
  releaseLinkRequired: 'PROJECT_RELEASE_LINK_REQUIRED',
  developmentMediaNotAllowed: 'PROJECT_DEVELOPMENT_MEDIA_NOT_ALLOWED',
  selectedImageRequired: 'PROJECT_SELECTED_IMAGE_REQUIRED',
  selectedImageInvalid: 'PROJECT_SELECTED_IMAGE_INVALID',
  duplicatedLinkType: 'PROJECT_LINK_TYPE_DUPLICATED',
  updateEmpty: 'PROJECT_UPDATE_EMPTY',
  notFound: 'PROJECT_NOT_FOUND',
  forbidden: 'PROJECT_FORBIDDEN',
  deleted: 'PROJECT_DELETED',
} as const;

export function createProjectBadRequestException(
  code: (typeof ProjectsErrorCode)[keyof typeof ProjectsErrorCode],
  message: string,
) {
  return new BadRequestException({ code, message });
}

export function createProjectProfileRequiredException() {
  return new ForbiddenException({
    code: ProjectsErrorCode.profileRequired,
    message: '프로젝트를 열기 전에 프로필 설정을 완료해주세요.',
  });
}

export function createProjectNotFoundException() {
  return new NotFoundException({
    code: ProjectsErrorCode.notFound,
    message: '프로젝트를 찾을 수 없습니다.',
  });
}

export function createProjectForbiddenException() {
  return new ForbiddenException({
    code: ProjectsErrorCode.forbidden,
    message: '이 프로젝트를 변경할 권한이 없습니다.',
  });
}

export function createProjectDeletedException() {
  return new GoneException({
    code: ProjectsErrorCode.deleted,
    message: '이미 삭제된 프로젝트입니다.',
  });
}
