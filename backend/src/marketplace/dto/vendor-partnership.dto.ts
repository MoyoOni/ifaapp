import { IsString, IsOptional, MinLength, IsArray, IsUUID } from 'class-validator';

// SHOP_BACKLOG.md MSP-005: a declared, self-service vendor group -- no admin
// review, unlike CreateBundleDto's proposals.
export class CreatePartnershipDto {
  @IsString()
  @MinLength(1)
  declare name: string;

  @IsString()
  @IsOptional()
  declare description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  declare memberVendorIds?: string[];

  @IsUUID()
  @IsOptional()
  declare plannedEventId?: string;
}
