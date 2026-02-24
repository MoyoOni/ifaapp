import { IsString, IsUUID } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  declare threadId: string;

  @IsString()
  declare content: string;
}
