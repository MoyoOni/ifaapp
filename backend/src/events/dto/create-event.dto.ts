import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export enum EventType {
  RITUAL = 'RITUAL',
  EDUCATIONAL = 'EDUCATIONAL',
  SOCIAL = 'SOCIAL',
  CEREMONY = 'CEREMONY',
  WORKSHOP = 'WORKSHOP',
}

export enum LocationType {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
  HYBRID = 'HYBRID',
}

export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  declare title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  declare description?: string;

  @IsEnum(EventType)
  declare type: EventType;

  @IsString()
  @IsOptional()
  declare category?: string;

  @IsDateString()
  declare startDate: string;

  @IsDateString()
  @IsOptional()
  declare endDate?: string;

  @IsString()
  @IsOptional()
  declare timezone?: string;

  @IsString()
  @IsOptional()
  declare location?: string;

  @IsEnum(LocationType)
  @IsOptional()
  declare locationType?: LocationType;

  @IsString()
  @IsOptional()
  declare virtualLink?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare price?: number;

  @IsString()
  @IsOptional()
  declare currency?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  declare capacity?: number;

  @IsBoolean()
  @IsOptional()
  declare requiresRegistration?: boolean;

  @IsDateString()
  @IsOptional()
  declare registrationDeadline?: string;

  @IsString()
  @IsOptional()
  declare image?: string;

  @IsString()
  @IsOptional()
  declare templeId?: string;

  @IsString()
  @IsOptional()
  declare circleId?: string;
}
