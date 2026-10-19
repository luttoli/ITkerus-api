import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenService } from './auth-token.service';
import { JwtConfigService } from './jwt-config.service';

const secret = 'test-secret-that-is-at-least-32-characters';

describe('AuthTokenService', () => {
  const jwtService = new JwtService();
  const jwtConfig = {
    access: {
      secret,
      expiresInSeconds: 3600,
    },
  } as JwtConfigService;
  const service = new AuthTokenService(jwtService, jwtConfig);

  it('issues and verifies an access token', async () => {
    const issued = await service.issueAccessToken('user-id');

    await expect(service.verifyAccessToken(issued.accessToken)).resolves.toBe(
      'user-id',
    );
    expect(issued.tokenType).toBe('Bearer');
    expect(issued.expiresInSeconds).toBe(3600);
  });

  it('rejects a tampered token with a stable error code', async () => {
    const issued = await service.issueAccessToken('user-id');
    const tampered = `${issued.accessToken.slice(0, -1)}x`;

    await expectUnauthorizedCode(
      service.verifyAccessToken(tampered),
      'AUTH_TOKEN_INVALID',
    );
  });

  it('rejects an expired token with a stable error code', async () => {
    const expired = await jwtService.signAsync(
      { sub: 'user-id', tokenType: 'access' },
      {
        secret,
        algorithm: 'HS256',
        issuer: 'itkerus-api',
        audience: 'itkerus-ios',
        expiresIn: -1,
      },
    );

    await expectUnauthorizedCode(
      service.verifyAccessToken(expired),
      'AUTH_TOKEN_EXPIRED',
    );
  });

  it('rejects a signed token without a user ID', async () => {
    const missingSubject = await jwtService.signAsync(
      { tokenType: 'access' },
      {
        secret,
        algorithm: 'HS256',
        issuer: 'itkerus-api',
        audience: 'itkerus-ios',
        expiresIn: 3600,
      },
    );

    await expectUnauthorizedCode(
      service.verifyAccessToken(missingSubject),
      'AUTH_TOKEN_INVALID',
    );
  });
});

async function expectUnauthorizedCode(
  promise: Promise<unknown>,
  expectedCode: string,
) {
  try {
    await promise;
    throw new Error('Expected an UnauthorizedException.');
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).getResponse()).toEqual(
      expect.objectContaining({ code: expectedCode }),
    );
  }
}
