import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard';
import { AuthTokenService } from './auth-token.service';
import { AuthenticatedRequest } from './authenticated-request';

describe('AccessTokenGuard', () => {
  it('stores the verified user ID on the request', async () => {
    const verifyAccessToken = jest.fn().mockResolvedValue(1);
    const authTokenService = {
      verifyAccessToken,
    } as unknown as AuthTokenService;
    const guard = new AccessTokenGuard(authTokenService);
    const { context, request } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(request.auth).toEqual({ userId: 1 });
  });

  it('rejects a missing authorization header', async () => {
    const authTokenService = {
      verifyAccessToken: jest.fn(),
    } as unknown as AuthTokenService;
    const guard = new AccessTokenGuard(authTokenService);
    const { context } = createContext();

    await expectUnauthorizedCode(
      guard.canActivate(context),
      'AUTH_TOKEN_MISSING',
    );
  });

  it('rejects a malformed authorization header', async () => {
    const authTokenService = {
      verifyAccessToken: jest.fn(),
    } as unknown as AuthTokenService;
    const guard = new AccessTokenGuard(authTokenService);
    const { context } = createContext('Basic invalid-token');

    await expectUnauthorizedCode(
      guard.canActivate(context),
      'AUTH_TOKEN_INVALID',
    );
  });
});

function createContext(authorization?: string) {
  const request = {
    headers: { authorization },
  } as AuthenticatedRequest;
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;

  return { context, request };
}

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
