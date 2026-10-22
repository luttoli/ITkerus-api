import { BadRequestException } from '@nestjs/common';
import {
  ITkerusRole,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';
import { createAppValidationPipe } from '../../common/validation/create-app-validation-pipe';
import { CreateProjectDto } from './create-project.dto';

describe('CreateProjectDto', () => {
  const validationPipe = createAppValidationPipe();
  const validRequest = {
    title: '  냉장고컷  ',
    summary: '  냉장고 속 재료로 요리를 추천하는 앱  ',
    story: '  남은 재료를 잊지 않도록 만들었어요.  ',
    status: ProjectStatus.RELEASED,
    purposes: [ProjectPurpose.INTRODUCTION, ProjectPurpose.QUESTION],
    itkerusFocus: '  첫 사용자도 재료 등록을 이해할 수 있을까요?  ',
    requestedRoles: [ITkerusRole.DESIGNER],
    iconUrl: 'https://example.com/icon.png',
    links: [
      {
        type: ProjectLinkType.APP_STORE,
        url: 'https://apps.apple.com/app/id123456789',
      },
    ],
    imageUrls: ['https://example.com/screenshot.png'],
    selectedImageUrl: 'https://example.com/screenshot.png',
  };

  it('trims and accepts a valid released project', async () => {
    await expect(transform(validRequest)).resolves.toEqual(
      expect.objectContaining({
        title: '냉장고컷',
        summary: '냉장고 속 재료로 요리를 추천하는 앱',
        story: '남은 재료를 잊지 않도록 만들었어요.',
        itkerusFocus: '첫 사용자도 재료 등록을 이해할 수 있을까요?',
      }),
    );
  });

  it('rejects an empty purpose array', async () => {
    await expectValidationError(transform({ ...validRequest, purposes: [] }));
  });

  it('rejects duplicated requested roles', async () => {
    await expectValidationError(
      transform({
        ...validRequest,
        requestedRoles: [ITkerusRole.DESIGNER, ITkerusRole.DESIGNER],
      }),
    );
  });

  it('rejects an insecure external URL', async () => {
    await expectValidationError(
      transform({
        ...validRequest,
        links: [{ type: ProjectLinkType.WEB, url: 'http://example.com' }],
      }),
    );
  });

  function transform(value: Record<string, unknown>) {
    return validationPipe.transform(value, {
      type: 'body',
      metatype: CreateProjectDto,
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
