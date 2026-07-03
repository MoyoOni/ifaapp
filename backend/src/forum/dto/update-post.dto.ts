import { IsString, IsOptional } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  content?: string;
}
