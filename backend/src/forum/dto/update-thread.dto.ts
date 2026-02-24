import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ThreadStatus } from '@ile-ase/common';

export class UpdateThreadDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(ThreadStatus)
  @IsOptional()
  status?: ThreadStatus;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}
