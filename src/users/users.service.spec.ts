import {
  BadRequestException,
  ConflictException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { ITkerusRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const findUnique = jest.fn();
  const update = jest.fn();
  const prisma = {
    user: { findUnique, update },
  } as unknown as PrismaService;
  const service = new UsersService(prisma);
  const storedProfile = {
    id: 'user-id',
    nickname: '잇커스',
    introduction: '함께 만드는 사람',
    primaryRole: ITkerusRole.DEVELOPER,
    secondaryRoles: [
      { role: ITkerusRole.DESIGNER },
      { role: ITkerusRole.PLANNER },
    ],
    isOnboardingCompleted: true,
    termsAcceptedAt: new Date('2026-10-26T00:00:00.000Z'),
    privacyAcceptedAt: new Date('2026-10-26T00:00:00.000Z'),
  };
  const request: UpdateMyProfileDto = {
    nickname: '잇커스',
    introduction: '함께 만드는 사람',
    primaryRole: ITkerusRole.DEVELOPER,
    secondaryRoles: [ITkerusRole.DESIGNER, ITkerusRole.PLANNER],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the authenticated user profile', async () => {
    findUnique.mockResolvedValue(storedProfile);

    await expect(service.getMyProfile('user-id')).resolves.toEqual({
      id: 'user-id',
      nickname: '잇커스',
      introduction: '함께 만드는 사람',
      primaryRole: ITkerusRole.DEVELOPER,
      secondaryRoles: [ITkerusRole.DESIGNER, ITkerusRole.PLANNER],
      isOnboardingCompleted: true,
    });
  });

  it('returns 401 when the token user no longer exists', async () => {
    findUnique.mockResolvedValue(null);

    await expectHttpError(
      service.getMyProfile('deleted-user-id'),
      UnauthorizedException,
      'AUTH_USER_NOT_FOUND',
    );
  });

  it('requires renewed login when the user has no consent record', async () => {
    findUnique.mockResolvedValue({
      ...storedProfile,
      termsAcceptedAt: null,
      privacyAcceptedAt: null,
    });

    await expectHttpError(
      service.getMyProfile('user-id'),
      HttpException,
      'AUTH_CONSENT_REQUIRED',
    );
  });

  it('replaces roles and completes onboarding atomically', async () => {
    update.mockResolvedValue(storedProfile);

    await expect(service.updateMyProfile('user-id', request)).resolves.toEqual(
      expect.objectContaining({
        id: 'user-id',
        isOnboardingCompleted: true,
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-id' },
        data: {
          nickname: '잇커스',
          introduction: '함께 만드는 사람',
          primaryRole: ITkerusRole.DEVELOPER,
          isOnboardingCompleted: true,
          secondaryRoles: {
            deleteMany: {},
            create: [
              { role: ITkerusRole.DESIGNER },
              { role: ITkerusRole.PLANNER },
            ],
          },
        },
      }),
    );
  });

  it('rejects a primary role duplicated in secondary roles', async () => {
    await expectHttpError(
      service.updateMyProfile('user-id', {
        ...request,
        secondaryRoles: [ITkerusRole.DEVELOPER],
      }),
      BadRequestException,
      'PROFILE_ROLE_CONFLICT',
    );
  });

  it('returns 409 for an already used nickname', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await expectHttpError(
      service.updateMyProfile('user-id', request),
      ConflictException,
      'NICKNAME_ALREADY_IN_USE',
    );
  });
});

async function expectHttpError(
  promise: Promise<unknown>,
  exceptionType:
    | typeof BadRequestException
    | typeof ConflictException
    | typeof HttpException
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
          | BadRequestException
          | ConflictException
          | HttpException
          | UnauthorizedException
      ).getResponse(),
    ).toEqual(expect.objectContaining({ code: expectedCode }));
  }
}
