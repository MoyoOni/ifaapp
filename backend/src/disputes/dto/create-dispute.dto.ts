import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum DisputeType {
  ORDER = 'ORDER',
  ESCROW = 'ESCROW',
  APPOINTMENT = 'APPOINTMENT',
  SPIRITUAL = 'SPIRITUAL',
  OTHER = 'OTHER',
}

export enum DisputeCategory {
  SPIRITUAL_MISCONDUCT = 'SPIRITUAL_MISCONDUCT',
  PRODUCT_QUALITY = 'PRODUCT_QUALITY',
  SERVICE_ISSUE = 'SERVICE_ISSUE',
  PAYMENT = 'PAYMENT',
  CULTURAL_AUTHENTICITY = 'CULTURAL_AUTHENTICITY',
  OTHER = 'OTHER',
}

/**
 * Create Dispute DTO
 */
export class CreateDisputeDto {
  @IsUUID()
  @IsOptional()
  declare orderId?: string;

  @IsUUID()
  @IsOptional()
  declare escrowId?: string;

  @IsUUID()
  @IsOptional()
  declare appointmentId?: string;

  @IsUUID()
  declare respondentId: string;

  @IsEnum(DisputeType)
  declare type: DisputeType;

  @IsEnum(DisputeCategory)
  declare category: DisputeCategory;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  declare title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  declare description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  declare evidence?: string[]; // URLs to evidence
}
