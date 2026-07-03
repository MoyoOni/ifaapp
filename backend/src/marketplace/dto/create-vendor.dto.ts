import { IsString, IsOptional, MinLength, IsUUID, IsEnum, IsUrl, IsBoolean } from 'class-validator';

/**
 * Yoruba Proficiency Level Enum
 */
export enum YorubaProficiencyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  NATIVE = 'NATIVE',
}

/**
 * Create Vendor DTO
 * Vendor registration/verification application with cultural vetting
 * NOTE: Similar verification rigor to Babalawo verification
 */
export class CreateVendorDto {
  @IsString()
  @MinLength(1)
  declare businessName: string;

  @IsString()
  @IsOptional()
  declare businessLicense?: string; // Registration number

  @IsString()
  @IsOptional()
  declare taxId?: string; // Tax identification for VAT compliance

  @IsUUID()
  @IsOptional()
  declare endorsementBy?: string; // User ID of endorsing Babalawo/elder

  @IsString()
  @IsOptional()
  declare description?: string;

  // Cultural Authenticity Fields
  @IsUrl()
  @IsOptional()
  declare artisanHeritageProof?: string; // Proof of artisan heritage (for crafts vendors)

  @IsEnum(YorubaProficiencyLevel)
  @IsOptional()
  declare yorubaProficiencyLevel?: YorubaProficiencyLevel; // For tutors/language vendors

  @IsUrl()
  @IsOptional()
  declare yorubaProficiencyProof?: string; // Documentation of Yoruba language proficiency

  @IsBoolean()
  @IsOptional()
  declare noCounterfeitSpiritualItems?: boolean; // Agreement to not sell counterfeit spiritual items
}
