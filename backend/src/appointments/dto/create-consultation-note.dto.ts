import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateConsultationNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsString()
  content!: string; // Using ! to tell TypeScript this will be initialized by the framework
}