import { IsString, IsUUID, IsEnum, IsOptional, IsNumber, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsUUID()
  declare sharedWith: string; // Client ID (access control)

  @IsEnum(['document', 'audio', 'video', 'image'])
  declare type: 'document' | 'audio' | 'video' | 'image';

  @IsString()
  @MinLength(1)
  declare filename: string;

  @IsNumber()
  @IsOptional()
  declare size?: number; // Size in bytes

  @IsString()
  @IsOptional()
  declare mimeType?: string;

  @IsString()
  @IsOptional()
  declare description?: string;
}
