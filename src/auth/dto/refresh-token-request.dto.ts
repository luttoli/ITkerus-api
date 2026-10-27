import { IsString, Length } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsString()
  @Length(43, 512)
  refreshToken!: string;
}
