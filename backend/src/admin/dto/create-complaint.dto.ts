import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum ComplaintReason {
  NO_SHOW = 'no-show',
  INAPPROPRIATE = 'inappropriate',
  FRAUD = 'fraud',
  OTHER = 'other',
}

export class CreateComplaintDto {
  @IsUUID()
  clientId!: string;

  @IsUUID()
  practitionerId!: string;

  @IsEnum(ComplaintReason)
  reason!: ComplaintReason;

  @IsString()
  description!: string;
}
