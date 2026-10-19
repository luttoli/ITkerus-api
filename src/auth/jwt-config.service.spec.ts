import { loadJwtAccessConfig } from './jwt-config.service';

describe('loadJwtAccessConfig', () => {
  it('loads a valid access token configuration', () => {
    expect(
      loadJwtAccessConfig({
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        JWT_ACCESS_EXPIRES_IN_SECONDS: '3600',
      }),
    ).toEqual({
      secret: 'a'.repeat(32),
      expiresInSeconds: 3600,
    });
  });

  it('rejects a short secret', () => {
    expect(() =>
      loadJwtAccessConfig({
        JWT_ACCESS_SECRET: 'too-short',
        JWT_ACCESS_EXPIRES_IN_SECONDS: '3600',
      }),
    ).toThrow('JWT_ACCESS_SECRET');
  });

  it('rejects a non-positive expiration', () => {
    expect(() =>
      loadJwtAccessConfig({
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        JWT_ACCESS_EXPIRES_IN_SECONDS: '0',
      }),
    ).toThrow('JWT_ACCESS_EXPIRES_IN_SECONDS');
  });
});
