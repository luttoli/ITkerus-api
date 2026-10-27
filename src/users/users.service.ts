import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AuthErrorCode,
  createConsentRequiredException,
  createUnauthorizedException,
} from '../auth/auth-error';
import { PrismaService } from '../prisma/prisma.service';
import { MyProfileResponseDto } from './dto/my-profile-response.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import {
  createNicknameConflictException,
  createRoleConflictException,
} from './users-error';

const profileSelect = {
  id: true,
  nickname: true,
  introduction: true,
  primaryRole: true,
  isOnboardingCompleted: true,
  termsAcceptedAt: true,
  privacyAcceptedAt: true,
  secondaryRoles: {
    orderBy: { createdAt: 'asc' as const },
    select: { role: true },
  },
} satisfies Prisma.UserSelect;

type ProfileResult = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: number): Promise<MyProfileResponseDto> {
    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!profile) {
      throw createUnauthorizedException(
        AuthErrorCode.userNotFound,
        '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
      );
    }

    if (!profile.termsAcceptedAt || !profile.privacyAcceptedAt) {
      throw createConsentRequiredException();
    }

    return this.toResponse(profile);
  }

  async updateMyProfile(
    userId: number,
    request: UpdateMyProfileDto,
  ): Promise<MyProfileResponseDto> {
    if (request.secondaryRoles.includes(request.primaryRole)) {
      throw createRoleConflictException();
    }

    try {
      const profile = await this.prisma.user.update({
        where: { id: userId },
        data: {
          nickname: request.nickname,
          introduction: request.introduction || null,
          primaryRole: request.primaryRole,
          isOnboardingCompleted: true,
          secondaryRoles: {
            deleteMany: {},
            create: request.secondaryRoles.map((role) => ({ role })),
          },
        },
        select: profileSelect,
      });

      return this.toResponse(profile);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw createNicknameConflictException();
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw createUnauthorizedException(
          AuthErrorCode.userNotFound,
          '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
        );
      }

      throw error;
    }
  }

  private toResponse(profile: ProfileResult): MyProfileResponseDto {
    return {
      id: profile.id,
      nickname: profile.nickname,
      introduction: profile.introduction,
      primaryRole: profile.primaryRole,
      secondaryRoles: profile.secondaryRoles.map(({ role }) => role),
      isOnboardingCompleted: profile.isOnboardingCompleted,
    };
  }
}
