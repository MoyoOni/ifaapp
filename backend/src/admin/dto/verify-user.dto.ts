import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { VerificationStage } from '@common/enums/verification-stage.enum';

export class VerifyUserDto {
  @IsString()
  declare userId: string;

  @IsEnum(VerificationStage)
  declare stage: VerificationStage;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsBoolean()
  declare approved: boolean;
}
