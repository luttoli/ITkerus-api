import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthErrorCode, createUnauthorizedException } from './auth-error';
import { JwtConfigService } from './jwt-config.service';

const tokenIssuer = 'itkerus-api';
const tokenAudience = 'itkerus-ios';

type AccessTokenPayload = {
  sub: string;
  tokenType: 'access';
};

export type IssuedAccessToken = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
};

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtConfig: JwtConfigService,
  ) {}

  async issueAccessToken(userId: number): Promise<IssuedAccessToken> {
    const payload: AccessTokenPayload = {
      sub: String(userId),
      tokenType: 'access',
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtConfig.access.secret,
      algorithm: 'HS256',
      issuer: tokenIssuer,
      audience: tokenAudience,
      expiresIn: this.jwtConfig.access.expiresInSeconds,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresInSeconds: this.jwtConfig.access.expiresInSeconds,
    };
  }

  async verifyAccessToken(token: string): Promise<number> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.jwtConfig.access.secret,
          algorithms: ['HS256'],
          issuer: tokenIssuer,
          audience: tokenAudience,
        },
      );

      const userId = Number(payload.sub);
      if (
        payload.tokenType !== 'access' ||
        typeof payload.sub !== 'string' ||
        !Number.isSafeInteger(userId) ||
        userId <= 0
      ) {
        throw createUnauthorizedException(
          AuthErrorCode.tokenInvalid,
          '인증 정보가 올바르지 않습니다.',
        );
      }

      return userId;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw createUnauthorizedException(
          AuthErrorCode.tokenExpired,
          '로그인이 만료되었습니다. 다시 로그인해주세요.',
        );
      }

      throw createUnauthorizedException(
        AuthErrorCode.tokenInvalid,
        '인증 정보가 올바르지 않습니다.',
      );
    }
  }
}
