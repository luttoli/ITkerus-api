import { BadRequestException } from '@nestjs/common';
import { createAppValidationPipe } from '../../common/validation/create-app-validation-pipe';
import { CreateNoteDto } from './create-note.dto';

describe('CreateNoteDto', () => {
  const validationPipe = createAppValidationPipe();

  it('trims and accepts a valid note', async () => {
    await expect(
      transform({
        content: '  사용 흐름이 자연스러워요.  ',
        didTryProject: true,
      }),
    ).resolves.toEqual({
      content: '사용 흐름이 자연스러워요.',
      didTryProject: true,
    });
  });

  it('rejects blank content', async () => {
    await expectValidationError(
      transform({ content: '   ', didTryProject: false }),
    );
  });

  it('rejects content longer than 600 characters', async () => {
    await expectValidationError(
      transform({ content: '가'.repeat(601), didTryProject: false }),
    );
  });

  it('rejects a non-boolean trial flag', async () => {
    await expectValidationError(
      transform({ content: '좋아요.', didTryProject: 'true' }),
    );
  });

  function transform(value: Record<string, unknown>) {
    return validationPipe.transform(value, {
      type: 'body',
      metatype: CreateNoteDto,
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
