import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClientSessionNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Content must not exceed 10,000 characters' })
  content?: string;
}