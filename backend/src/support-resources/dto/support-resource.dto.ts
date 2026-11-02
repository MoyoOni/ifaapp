import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';

export class CreateSupportResourceDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  /** A country name, or "International". */
  @IsString()
  @Length(2, 60)
  country!: string;

  @IsOptional()
  @IsString()
  @Length(3, 40)
  phone?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https', 'http'] })
  url?: string;

  /** What they help with, e.g. "Crisis and suicide prevention". */
  @IsString()
  @Length(2, 120)
  helpsWith!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateSupportResourceDto {
  @IsOptional() @IsString() @Length(2, 120) name?: string;
  @IsOptional() @IsString() @Length(2, 60) country?: string;
  @IsOptional() @IsString() @Length(3, 40) phone?: string;
  @IsOptional() @IsUrl({ require_protocol: true, protocols: ['https', 'http'] }) url?: string;
  @IsOptional() @IsString() @Length(2, 120) helpsWith?: string;
  @IsOptional() @IsString() @Length(0, 500) description?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
