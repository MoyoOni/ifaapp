import { IsString, IsUUID, IsBoolean, IsOptional } from 'class-validator';

// SHOP_BACKLOG.md MSP-008: "Vendor request flow for seasonal item
// promotions, routed through existing admin review"
export class RequestEventFeatureDto {
  @IsUUID()
  declare productId: string;
}

export class ReviewEventFeatureDto {
  @IsBoolean()
  declare approved: boolean;

  @IsString()
  @IsOptional()
  declare rejectionReason?: string;
}
