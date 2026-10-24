import { ITkerusRole, ProjectPurpose, ProjectStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateProjectLinkDto } from './create-project.dto';

export class UpdateProjectDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title?: string;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  summary?: string;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  story?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ArrayUnique()
  @IsEnum(ProjectPurpose, { each: true })
  purposes?: ProjectPurpose[];

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(150)
  itkerusFocus?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsEnum(ITkerusRole, { each: true })
  requestedRoles?: ITkerusRole[];

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  iconUrl?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => CreateProjectLinkDto)
  links?: CreateProjectLinkDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  @MaxLength(2048, { each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  selectedImageUrl?: string | null;
}

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
