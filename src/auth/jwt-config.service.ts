import { Injectable } from '@nestjs/common';

const minimumSecretLength = 32;

export type JwtAccessConfig = {
  secret: string;
  expiresInSeconds: number;
};

export type RefreshTokenConfig = {
  expiresInSeconds: number;
};

export function loadJwtAccessConfig(
  environment: NodeJS.ProcessEnv,
): JwtAccessConfig {
  const secret = environment.JWT_ACCESS_SECRET?.trim();
  if (!secret || secret.length < minimumSecretLength) {
    throw new Error(
      `JWT_ACCESS_SECRET must contain at least ${minimumSecretLength} characters.`,
    );
  }

  const expiresInSeconds = Number(environment.JWT_ACCESS_EXPIRES_IN_SECONDS);
  if (!Number.isSafeInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error(
      'JWT_ACCESS_EXPIRES_IN_SECONDS must be a positive integer.',
    );
  }

  return { secret, expiresInSeconds };
}

export function loadRefreshTokenConfig(
  environment: NodeJS.ProcessEnv,
): RefreshTokenConfig {
  const expiresInSeconds = Number(environment.REFRESH_TOKEN_EXPIRES_IN_SECONDS);
  if (!Number.isSafeInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error(
      'REFRESH_TOKEN_EXPIRES_IN_SECONDS must be a positive integer.',
    );
  }

  return { expiresInSeconds };
}

@Injectable()
export class JwtConfigService {
  readonly access = loadJwtAccessConfig(process.env);
  readonly refresh = loadRefreshTokenConfig(process.env);
}
