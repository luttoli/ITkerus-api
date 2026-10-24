import { BadRequestException } from '@nestjs/common';
import { createAppValidationPipe } from '../../common/validation/create-app-validation-pipe';
import {
  defaultProjectListLimit,
  GetProjectsQueryDto,
  maximumProjectListLimit,
} from './get-projects-query.dto';

describe('GetProjectsQueryDto', () => {
  const validationPipe = createAppValidationPipe();

  it('uses the default limit when query parameters are omitted', async () => {
    await expect(transform({})).resolves.toEqual(
      expect.objectContaining({ limit: defaultProjectListLimit }),
    );
  });

  it('converts a valid limit query string to a number', async () => {
    await expect(
      transform({ limit: '30', cursor: 'opaque-cursor' }),
    ).resolves.toEqual(
      expect.objectContaining({ limit: 30, cursor: 'opaque-cursor' }),
    );
  });

  it('rejects a limit greater than the maximum', async () => {
    await expectValidationError(
      transform({ limit: String(maximumProjectListLimit + 1) }),
    );
  });

  it('rejects a non-integer limit', async () => {
    await expectValidationError(transform({ limit: '1.5' }));
  });

  function transform(value: Record<string, unknown>) {
    return validationPipe.transform(value, {
      type: 'query',
      metatype: GetProjectsQueryDto,
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
