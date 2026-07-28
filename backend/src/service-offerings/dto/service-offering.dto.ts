import { IsString, IsOptional, IsBoolean, IsInt, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateServiceOfferingDto {
  @IsString()
  @MaxLength(120)
  declare name: string;

  @IsString()
  @MaxLength(2000)
  declare description: string;

  @IsString()
  @MaxLength(60)
  declare category: string;

  @IsInt()
  @Min(15)
  declare durationMinutes: number;

  @IsNumber()
  @Min(0)
  declare priceAmount: number;

  @IsString()
  @IsOptional()
  declare priceCurrency?: string;

  @IsBoolean()
  @IsOptional()
  declare isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  declare maxSessionsPerDay?: number;
}

export class UpdateServiceOfferingDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  declare name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  declare description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  declare category?: string;

  @IsInt()
  @IsOptional()
  @Min(15)
  declare durationMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  declare priceAmount?: number;

  @IsString()
  @IsOptional()
  declare priceCurrency?: string;

  @IsBoolean()
  @IsOptional()
  declare isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  declare maxSessionsPerDay?: number;
}
