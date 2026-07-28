import { IsIn, IsString, MinLength } from 'class-validator';

export class ApplyVendorCertificationDto {
  @IsIn(['COMMUNITY_VERIFIED', 'ELDER_ENDORSED'])
  declare requestedTier: 'COMMUNITY_VERIFIED' | 'ELDER_ENDORSED';

  @IsString()
  @MinLength(20)
  declare documentation: string;
}
