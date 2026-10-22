import { BadRequestException, ForbiddenException } from '@nestjs/common';

export const ProjectsErrorCode = {
  profileRequired: 'PROJECT_PROFILE_REQUIRED',
  focusRequired: 'PROJECT_FOCUS_REQUIRED',
  releaseLinkRequired: 'PROJECT_RELEASE_LINK_REQUIRED',
  developmentMediaNotAllowed: 'PROJECT_DEVELOPMENT_MEDIA_NOT_ALLOWED',
  selectedImageRequired: 'PROJECT_SELECTED_IMAGE_REQUIRED',
  selectedImageInvalid: 'PROJECT_SELECTED_IMAGE_INVALID',
  duplicatedLinkType: 'PROJECT_LINK_TYPE_DUPLICATED',
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
