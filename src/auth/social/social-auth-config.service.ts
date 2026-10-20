import { Injectable } from '@nestjs/common';
import {
  AuthErrorCode,
  createAuthServiceUnavailableException,
} from '../auth-error';

@Injectable()
export class SocialAuthConfigService {
  get appleClientId(): string {
    return this.requireProviderValue('APPLE_CLIENT_ID', 'Apple');
  }

  get kakaoAppKey(): string {
    return this.requireProviderValue('KAKAO_APP_KEY', 'Kakao');
  }

  private requireProviderValue(name: string, providerName: string): string {
    const value = process.env[name]?.trim();
    if (!value || value === 'CHANGE_ME') {
      throw createAuthServiceUnavailableException(
        AuthErrorCode.providerNotConfigured,
        `${providerName} 로그인이 아직 설정되지 않았습니다.`,
      );
    }

    return value;
  }
}
