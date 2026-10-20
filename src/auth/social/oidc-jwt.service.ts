import { Injectable } from '@nestjs/common';
import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
  JWTVerifyGetKey,
  JWTVerifyOptions,
} from 'jose';

const appleJwks = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
  {
    cacheMaxAge: 10 * 60 * 1000,
    cooldownDuration: 30 * 1000,
    timeoutDuration: 5 * 1000,
  },
);
const kakaoJwks = createRemoteJWKSet(
  new URL('https://kauth.kakao.com/.well-known/jwks.json'),
  {
    cacheMaxAge: 10 * 60 * 1000,
    cooldownDuration: 30 * 1000,
    timeoutDuration: 5 * 1000,
  },
);

@Injectable()
export class OidcJwtService {
  async verifyApple(token: string, audience: string): Promise<JWTPayload> {
    return this.verify(token, appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience,
      algorithms: ['RS256'],
      requiredClaims: ['sub', 'iat', 'exp', 'nonce'],
      clockTolerance: 5,
    });
  }

  async verifyKakao(token: string, audience: string): Promise<JWTPayload> {
    return this.verify(token, kakaoJwks, {
      issuer: 'https://kauth.kakao.com',
      audience,
      algorithms: ['RS256'],
      requiredClaims: ['sub', 'iat', 'exp', 'nonce'],
      clockTolerance: 5,
    });
  }

  private async verify(
    token: string,
    keySet: JWTVerifyGetKey,
    options: JWTVerifyOptions,
  ): Promise<JWTPayload> {
    const result = await jwtVerify(token, keySet, options);
    return result.payload;
  }
}
