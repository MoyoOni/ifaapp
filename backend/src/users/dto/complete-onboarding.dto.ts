import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, ArrayMaxSize } from 'class-validator';

/**
 * The only fields PATCH /users/:id/onboarding accepts. This must be a real
 * class (not Partial<UpdateUserDto>, which TypeScript erases to Object so the
 * global whitelist ValidationPipe skips it) -- otherwise anything in the body,
 * including role/verified/adminSubRole, would reach prisma.user.update.
 */
export class CompleteOnboardingDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  declare yorubaName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  declare location?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  declare intentTags?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  declare timezone?: string;

  // Sent by the onboarding UI but not persisted: the User model has no
  // preferredLanguage column (the choice only drives the narrator's voice).
  // Accepted so the existing client keeps working, then ignored.
  @IsString()
  @IsOptional()
  @MaxLength(20)
  declare preferredLanguage?: string;

  // Sent by the UI; the service always sets hasOnboarded itself.
  @IsBoolean()
  @IsOptional()
  declare hasOnboarded?: boolean;
}
