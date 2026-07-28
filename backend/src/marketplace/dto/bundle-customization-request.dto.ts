import { IsString, MinLength } from 'class-validator';

// SHOP_BACKLOG.md MSP-019: "Kit customization ('I have X, I need Y')"
export class CreateBundleCustomizationRequestDto {
  @IsString()
  @MinLength(1)
  declare haveItems: string;

  @IsString()
  @MinLength(1)
  declare needItems: string;
}

export class RespondToBundleCustomizationRequestDto {
  @IsString()
  @MinLength(1)
  declare vendorResponse: string;
}
