import { validate } from 'class-validator';
import { RefreshTokenRequestDto } from './refresh-token-request.dto';

describe('RefreshTokenRequestDto', () => {
  it('accepts a generated-length refresh token', async () => {
    const request = new RefreshTokenRequestDto();
    request.refreshToken = 'a'.repeat(43);

    await expect(validate(request)).resolves.toHaveLength(0);
  });

  it('rejects a short refresh token', async () => {
    const request = new RefreshTokenRequestDto();
    request.refreshToken = 'short';

    await expect(validate(request)).resolves.not.toHaveLength(0);
  });
});
