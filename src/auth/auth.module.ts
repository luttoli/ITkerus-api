import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from './access-token.guard';
import { AuthTokenService } from './auth-token.service';
import { JwtConfigService } from './jwt-config.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [JwtConfigService, AuthTokenService, AccessTokenGuard],
  exports: [AuthTokenService, AccessTokenGuard],
})
export class AuthModule {}
