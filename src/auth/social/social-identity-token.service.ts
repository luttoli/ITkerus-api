import { createHash, timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SocialProvider } from '@prisma/client';
import { errors, JWTPayload } from 'jose';
import {
  AuthErrorCode,
  createAuthServiceUnavailableException,
  createUnauthorizedException,
} from '../auth-error';
import { OidcJwtService } from './oidc-jwt.service';
import { SocialAuthConfigService } from './social-auth-config.service';

export type VerifiedSocialIdentity = {
  provider: SocialProvider;
  providerUserId: string;
};

@Injectable()
export class SocialIdentityTokenService {
  constructor(
    private readonly oidcJwtService: OidcJwtService,
    private readonly socialAuthConfig: SocialAuthConfigService,
  ) {}

  async verify(
    provider: SocialProvider,
    identityToken: string,
    rawNonce: string,
  ): Promise<VerifiedSocialIdentity> {
    try {
      switch (provider) {
        case SocialProvider.APPLE:
          return await this.verifyApple(identityToken, rawNonce);
        case SocialProvider.KAKAO:
          return await this.verifyKakao(identityToken, rawNonce);
      }
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      if (error instanceof errors.JWKSTimeout || error instanceof TypeError) {
        throw createAuthServiceUnavailableException(
          AuthErrorCode.providerUnavailable,
          '로그인 제공자와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      throw createUnauthorizedException(
        AuthErrorCode.providerTokenInvalid,
        '소셜 로그인 인증 정보가 올바르지 않습니다.',
      );
    }
  }

  private async verifyApple(
    identityToken: string,
    rawNonce: string,
  ): Promise<VerifiedSocialIdentity> {
    const payload = await this.oidcJwtService.verifyApple(
      identityToken,
      this.socialAuthConfig.appleClientId,
    );
    const hashedNonce = createHash('sha256').update(rawNonce).digest('hex');

    this.validateCommonClaims(payload, hashedNonce);
    return {
      provider: SocialProvider.APPLE,
      providerUserId: payload.sub!,
    };
  }

  private async verifyKakao(
    identityToken: string,
    nonce: string,
  ): Promise<VerifiedSocialIdentity> {
    const payload = await this.oidcJwtService.verifyKakao(
      identityToken,
      this.socialAuthConfig.kakaoAppKey,
    );

    this.validateCommonClaims(payload, nonce);
    return {
      provider: SocialProvider.KAKAO,
      providerUserId: payload.sub!,
    };
  }

  private validateCommonClaims(payload: JWTPayload, expectedNonce: string) {
    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.iat !== 'number' ||
      payload.iat > Math.floor(Date.now() / 1000) + 5 ||
      typeof payload.nonce !== 'string' ||
      !safeEqual(payload.nonce, expectedNonce)
    ) {
      throw createUnauthorizedException(
        AuthErrorCode.providerTokenInvalid,
        '소셜 로그인 인증 정보가 올바르지 않습니다.',
      );
    }
  }
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}
