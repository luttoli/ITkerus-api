import { BadRequestException, ConflictException } from '@nestjs/common';

export const UsersErrorCode = {
  roleConflict: 'PROFILE_ROLE_CONFLICT',
  nicknameAlreadyInUse: 'NICKNAME_ALREADY_IN_USE',
} as const;

export function createRoleConflictException() {
  return new BadRequestException({
    code: UsersErrorCode.roleConflict,
    message: '주 역할과 보조 역할은 중복될 수 없습니다.',
  });
}

export function createNicknameConflictException() {
  return new ConflictException({
    code: UsersErrorCode.nicknameAlreadyInUse,
    message: '이미 사용 중인 닉네임입니다.',
  });
}
