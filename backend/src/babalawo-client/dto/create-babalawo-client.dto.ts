import { IsString, IsOptional, IsUUID, IsEnum, IsInt, IsBoolean, Min, Max } from 'class-validator';

export enum RelationshipType {
  ONE_OFF = 'ONE_OFF',
  PERSONAL_AWO = 'PERSONAL_AWO',
}

export class CreateBabalawoClientDto {
  @IsUUID()
  declare clientId: string;
  @IsEnum(RelationshipType)
  declare relationshipType: RelationshipType;

  // Personal Awo specific fields
  @IsInt()
  @IsOptional()
  @Min(3)
  @Max(12)
  declare durationMonths?: number; // 3, 6, or 12 months

  @IsBoolean()
  @IsOptional()
  declare covenantAgreed?: boolean;

  @IsString()
  @IsOptional()
  declare covenantText?: string;

  @IsBoolean()
  @IsOptional()
  declare exclusivityAcknowledged?: boolean;

  @IsString()
  @IsOptional()
  declare notes?: string; // Private notes from Babalawo
}
