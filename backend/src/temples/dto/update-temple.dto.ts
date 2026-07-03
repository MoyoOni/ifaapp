import { PartialType } from '@nestjs/mapped-types';
import { CreateTempleDto } from './create-temple.dto';
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

/**
 * Update Temple DTO
 * NOTE: Only founder or admin can update temple
 */
export class UpdateTempleDto extends PartialType(CreateTempleDto) {
  @IsOptional()
  @IsString()
  declare status?: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';

  @IsOptional()
  @IsBoolean()
  declare verified?: boolean;

  @IsOptional()
  @IsDateString()
  declare verifiedAt?: string;

  @IsOptional()
  @IsString()
  declare verifiedBy?: string;
}
