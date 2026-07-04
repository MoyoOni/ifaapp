import { IsOptional, IsString } from 'class-validator';

export class UpdateConsultationNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
