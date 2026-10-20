import { ServiceUnavailableException } from '@nestjs/common';
import { SocialAuthConfigService } from './social-auth-config.service';

describe('SocialAuthConfigService', () => {
  const originalAppleClientId = process.env.APPLE_CLIENT_ID;
  const originalKakaoAppKey = process.env.KAKAO_APP_KEY;
  const service = new SocialAuthConfigService();

  afterEach(() => {
    restoreEnvironmentValue('APPLE_CLIENT_ID', originalAppleClientId);
    restoreEnvironmentValue('KAKAO_APP_KEY', originalKakaoAppKey);
  });

  it('loads configured provider audiences', () => {
    process.env.APPLE_CLIENT_ID = 'com.luttoil.ITkerus';
    process.env.KAKAO_APP_KEY = 'kakao-app-key';

    expect(service.appleClientId).toBe('com.luttoil.ITkerus');
    expect(service.kakaoAppKey).toBe('kakao-app-key');
  });

  it('rejects a missing provider configuration with a stable 503 code', () => {
    delete process.env.KAKAO_APP_KEY;

    try {
      void service.kakaoAppKey;
      throw new Error('Expected a ServiceUnavailableException.');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toEqual(
        expect.objectContaining({ code: 'AUTH_PROVIDER_NOT_CONFIGURED' }),
      );
    }
  });
});

function restoreEnvironmentValue(name: string, value?: string) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
