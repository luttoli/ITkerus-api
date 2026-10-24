import { Transform } from 'class-transformer';
import { IsBoolean, IsString, Length } from 'class-validator';

export class CreateNoteDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 600)
  content!: string;

  @IsBoolean()
  didTryProject!: boolean;
}

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
