import { ConflictException, ForbiddenException } from '@nestjs/common';

export const NotesErrorCode = {
  profileRequired: 'NOTE_PROFILE_REQUIRED',
  ownProjectForbidden: 'NOTE_OWN_PROJECT_FORBIDDEN',
  alreadyExists: 'NOTE_ALREADY_EXISTS',
} as const;

export function createNoteProfileRequiredException() {
  return new ForbiddenException({
    code: NotesErrorCode.profileRequired,
    message: '잇커스 노트를 남기기 전에 프로필 설정을 완료해주세요.',
  });
}

export function createOwnProjectNoteForbiddenException() {
  return new ForbiddenException({
    code: NotesErrorCode.ownProjectForbidden,
    message: '자신의 프로젝트에는 잇커스 노트를 남길 수 없습니다.',
  });
}

export function createNoteAlreadyExistsException() {
  return new ConflictException({
    code: NotesErrorCode.alreadyExists,
    message: '이 프로젝트에 이미 잇커스 노트를 남겼습니다.',
  });
}
