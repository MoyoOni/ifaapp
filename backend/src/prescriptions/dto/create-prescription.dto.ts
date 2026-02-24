import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency } from '@ile-ase/common';

export enum GuidancePlanType {
  AKOSE = 'AKOSE',
  EBO = 'EBO',
  BOTH = 'BOTH',
}

export class GuidancePlanItemDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  cost!: number;
}

export class CreateGuidancePlanDto {
  @IsString()
  appointmentId!: string;

  @IsEnum(GuidancePlanType)
  type!: GuidancePlanType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuidancePlanItemDto)
  items!: GuidancePlanItemDto[];

  @IsNumber()
  @Min(0)
  totalCost!: number;

  @IsString()
  @IsOptional()
  currency?: Currency;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
