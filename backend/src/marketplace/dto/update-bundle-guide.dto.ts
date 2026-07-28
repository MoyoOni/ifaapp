import { IsString, IsOptional, IsUrl } from 'class-validator';

// SHOP_BACKLOG.md MSP-019: step-by-step ritual guide + optional elder
// audio/video link, editable by the bundle's own vendor without triggering
// re-review (additive guidance, not a pricing/item change).
export class UpdateBundleGuideDto {
  @IsString()
  @IsOptional()
  declare ritualGuide?: string;

  @IsUrl()
  @IsOptional()
  declare guideSourceUrl?: string;
}
