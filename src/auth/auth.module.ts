import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from './access-token.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { JwtConfigService } from './jwt-config.service';
import { OidcJwtService } from './social/oidc-jwt.service';
import { SocialAuthConfigService } from './social/social-auth-config.service';
import { SocialIdentityTokenService } from './social/social-identity-token.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    JwtConfigService,
    AuthTokenService,
    AccessTokenGuard,
    SocialAuthConfigService,
    OidcJwtService,
    SocialIdentityTokenService,
    AuthService,
  ],
  exports: [AuthTokenService, AccessTokenGuard],
})
export class AuthModule {}
