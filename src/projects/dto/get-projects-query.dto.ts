import { ITkerusRole, ProjectPurpose, ProjectStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const defaultProjectListLimit = 20;
export const maximumProjectListLimit = 50;

export enum ProjectListSort {
  LATEST = 'LATEST',
  ITKERUS_NOTES = 'ITKERUS_NOTES',
  HELPFUL = 'HELPFUL',
}

export class GetProjectsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @Transform(({ value }: { value: unknown }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @IsEnum(ITkerusRole)
  role?: ITkerusRole;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectPurpose)
  purpose?: ProjectPurpose;

  @IsEnum(ProjectListSort)
  sort: ProjectListSort = ProjectListSort.LATEST;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(maximumProjectListLimit)
  limit: number = defaultProjectListLimit;
}

function trimOptionalString(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}
