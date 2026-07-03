import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ApproveGuidancePlanDto {
  @IsBoolean()
  approve!: boolean; // true to approve, false to reject

  @IsString()
  @IsOptional()
  notes?: string; // Client notes or rejection reason
}
