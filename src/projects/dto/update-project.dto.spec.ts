import { BadRequestException } from '@nestjs/common';
import { ProjectLinkType, ProjectStatus } from '@prisma/client';
import { createAppValidationPipe } from '../../common/validation/create-app-validation-pipe';
import { UpdateProjectDto } from './update-project.dto';

describe('UpdateProjectDto', () => {
  const validationPipe = createAppValidationPipe();

  it('trims a partial update and accepts null for cleared media', async () => {
    await expect(
      transform({
        title: '  새 프로젝트 이름  ',
        status: ProjectStatus.IN_DEVELOPMENT,
        iconUrl: null,
        selectedImageUrl: null,
        links: [],
        imageUrls: [],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        title: '새 프로젝트 이름',
        iconUrl: null,
        selectedImageUrl: null,
      }),
    );
  });

  it('rejects a blank title when title is included', async () => {
    await expectValidationError(transform({ title: '   ' }));
  });

  it('rejects an insecure link in a partial update', async () => {
    await expectValidationError(
      transform({
        links: [
          {
            type: ProjectLinkType.WEB,
            url: 'http://example.com',
          },
        ],
      }),
    );
  });

  function transform(value: Record<string, unknown>) {
    return validationPipe.transform(value, {
      type: 'body',
      metatype: UpdateProjectDto,
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
