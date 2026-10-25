import { BadRequestException } from '@nestjs/common';
import { SocialProvider } from '@prisma/client';
import { createAppValidationPipe } from '../../common/validation/create-app-validation-pipe';
import { LoginRequestDto } from './login-request.dto';

describe('LoginRequestDto', () => {
  const validationPipe = createAppValidationPipe();

  it('accepts a supported provider, identity token, nonce and consent', async () => {
    await expect(
      validationPipe.transform(
        {
          provider: SocialProvider.APPLE,
          identityToken: 'identity-token',
          nonce: 'nonce-with-16-characters',
          acceptedTerms: true,
          acceptedPrivacy: true,
        },
        { type: 'body', metatype: LoginRequestDto },
      ),
    ).resolves.toBeInstanceOf(LoginRequestDto);
  });

  it('rejects an unsupported provider with a stable 400 code', async () => {
    await expectValidationError(
      validationPipe.transform(
        {
          provider: 'GOOGLE',
          identityToken: 'identity-token',
          nonce: 'nonce-with-16-characters',
        },
        { type: 'body', metatype: LoginRequestDto },
      ),
    );
  });

  it('rejects a short nonce with a stable 400 code', async () => {
    await expectValidationError(
      validationPipe.transform(
        {
          provider: SocialProvider.KAKAO,
          identityToken: 'identity-token',
          nonce: 'short',
        },
        { type: 'body', metatype: LoginRequestDto },
      ),
    );
  });

  it('rejects non-boolean consent values', async () => {
    await expectValidationError(
      validationPipe.transform(
        {
          provider: SocialProvider.APPLE,
          identityToken: 'identity-token',
          nonce: 'nonce-with-16-characters',
          acceptedTerms: 'true',
          acceptedPrivacy: true,
        },
        { type: 'body', metatype: LoginRequestDto },
      ),
    );
  });
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
