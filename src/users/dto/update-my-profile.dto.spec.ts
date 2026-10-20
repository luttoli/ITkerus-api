import { BadRequestException } from '@nestjs/common';
import { ITkerusRole } from '@prisma/client';
import { createAppValidationPipe } from '../../common/validation/create-app-validation-pipe';
import { UpdateMyProfileDto } from './update-my-profile.dto';

describe('UpdateMyProfileDto', () => {
  const validationPipe = createAppValidationPipe();

  it('trims and accepts a valid onboarding profile', async () => {
    await expect(
      transform({
        nickname: '  잇커스  ',
        introduction: '  함께 만드는 사람  ',
        primaryRole: ITkerusRole.DEVELOPER,
        secondaryRoles: [ITkerusRole.DESIGNER, ITkerusRole.PLANNER],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        nickname: '잇커스',
        introduction: '함께 만드는 사람',
      }),
    );
  });

  it('rejects a nickname shorter than two characters', async () => {
    await expectValidationError(
      transform({
        nickname: '잇',
        primaryRole: ITkerusRole.DEVELOPER,
        secondaryRoles: [],
      }),
    );
  });

  it('rejects more than two secondary roles', async () => {
    await expectValidationError(
      transform({
        nickname: '잇커스',
        primaryRole: ITkerusRole.DEVELOPER,
        secondaryRoles: [
          ITkerusRole.DESIGNER,
          ITkerusRole.PLANNER,
          ITkerusRole.MARKETER,
        ],
      }),
    );
  });

  it('rejects duplicated secondary roles', async () => {
    await expectValidationError(
      transform({
        nickname: '잇커스',
        primaryRole: ITkerusRole.DEVELOPER,
        secondaryRoles: [ITkerusRole.DESIGNER, ITkerusRole.DESIGNER],
      }),
    );
  });

  function transform(value: Record<string, unknown>) {
    return validationPipe.transform(value, {
      type: 'body',
      metatype: UpdateMyProfileDto,
    });
  }
});

async function expectValidationError(promise: Promise<unknown>) {
  try {
    await promise;
    throw new Error('Expected a BadRequestException.');
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toEqual({
      code: 'VALIDATION_ERROR',
      message: '요청값을 확인해주세요.',
    });
  }
}
