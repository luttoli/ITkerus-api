import { SocialProvider } from '@prisma/client';
import {
  IsEnum,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginRequestDto {
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  identityToken!: string;

  @IsString()
  @Length(16, 256)
  nonce!: string;
}
