import { ITkerusRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateMyProfileDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(2, 10)
  nickname!: string;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(60)
  introduction?: string;

  @IsEnum(ITkerusRole)
  primaryRole!: ITkerusRole;

  @IsArray()
  @ArrayMaxSize(2)
  @ArrayUnique()
  @IsEnum(ITkerusRole, { each: true })
  secondaryRoles!: ITkerusRole[];
}

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
