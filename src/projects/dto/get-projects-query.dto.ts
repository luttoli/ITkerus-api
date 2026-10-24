import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const defaultProjectListLimit = 20;
export const maximumProjectListLimit = 50;

export class GetProjectsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(maximumProjectListLimit)
  limit: number = defaultProjectListLimit;
}
