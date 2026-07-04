import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateClientSessionNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10000, { message: 'Content must not exceed 10,000 characters' })
  content!: string; // Using ! to tell TypeScript this will be initialized by the framework
}
