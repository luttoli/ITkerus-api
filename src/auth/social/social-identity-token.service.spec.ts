import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SocialProvider } from '@prisma/client';
import { createHash } from 'node:crypto';
import { OidcJwtService } from './oidc-jwt.service';
import { SocialAuthConfigService } from './social-auth-config.service';
import { SocialIdentityTokenService } from './social-identity-token.service';

describe('SocialIdentityTokenService', () => {
  const verifyApple = jest.fn();
  const verifyKakao = jest.fn();
  const oidcJwtService = {
    verifyApple,
    verifyKakao,
  } as unknown as OidcJwtService;
  const socialAuthConfig = {
    appleClientId: 'com.luttoil.ITkerus',
    kakaoAppKey: 'kakao-app-key',
  } as SocialAuthConfigService;
  const service = new SocialIdentityTokenService(
    oidcJwtService,
    socialAuthConfig,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies Apple subject and SHA-256 nonce', async () => {
    const rawNonce = 'apple-raw-nonce-value';
    const hashedNonce = createHash('sha256').update(rawNonce).digest('hex');
    verifyApple.mockResolvedValue({
      sub: 'apple-user-id',
      iat: Math.floor(Date.now() / 1000),
      nonce: hashedNonce,
    });

    await expect(
      service.verify(SocialProvider.APPLE, 'identity-token', rawNonce),
    ).resolves.toEqual({
      provider: SocialProvider.APPLE,
      providerUserId: 'apple-user-id',
    });
    expect(verifyApple).toHaveBeenCalledWith(
      'identity-token',
      'com.luttoil.ITkerus',
    );
  });

  it('verifies Kakao subject and original nonce', async () => {
    const nonce = 'kakao-original-nonce';
    verifyKakao.mockResolvedValue({
      sub: 'kakao-user-id',
      iat: Math.floor(Date.now() / 1000),
      nonce,
    });

    await expect(
      service.verify(SocialProvider.KAKAO, 'identity-token', nonce),
    ).resolves.toEqual({
      provider: SocialProvider.KAKAO,
      providerUserId: 'kakao-user-id',
    });
  });

  it('rejects a mismatched nonce with a stable 401 code', async () => {
    verifyKakao.mockResolvedValue({
      sub: 'kakao-user-id',
      iat: Math.floor(Date.now() / 1000),
      nonce: 'different-nonce-value',
    });

    await expectExceptionCode(
      service.verify(
        SocialProvider.KAKAO,
        'identity-token',
        'expected-nonce-value',
      ),
      UnauthorizedException,
      'AUTH_PROVIDER_TOKEN_INVALID',
    );
  });

  it('maps an invalid provider token to a stable 401 code', async () => {
    verifyApple.mockRejectedValue(new Error('invalid signature'));

    await expectExceptionCode(
      service.verify(
        SocialProvider.APPLE,
        'invalid-token',
        'apple-raw-nonce-value',
      ),
      UnauthorizedException,
      'AUTH_PROVIDER_TOKEN_INVALID',
    );
  });

  it('maps provider network failure to a stable 503 code', async () => {
    verifyKakao.mockRejectedValue(new TypeError('fetch failed'));

    await expectExceptionCode(
      service.verify(
        SocialProvider.KAKAO,
        'identity-token',
        'kakao-original-nonce',
      ),
      ServiceUnavailableException,
      'AUTH_PROVIDER_UNAVAILABLE',
    );
  });
});

async function expectExceptionCode(
  promise: Promise<unknown>,
  exceptionType:
    typeof UnauthorizedException | typeof ServiceUnavailableException,
  expectedCode: string,
) {
  try {
    await promise;
    throw new Error('Expected an HTTP exception.');
  } catch (error) {
    expect(error).toBeInstanceOf(exceptionType);
    expect(
      (
        error as UnauthorizedException | ServiceUnavailableException
      ).getResponse(),
    ).toEqual(expect.objectContaining({ code: expectedCode }));
  }
}
