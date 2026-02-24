import { IsOptional, IsString, IsEmail, IsEnum, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { UserRole } from '@common/enums/user-role.enum';
import { CulturalLevel } from '@common/enums/cultural-level.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  yorubaName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  aboutMe?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(CulturalLevel)
  culturalLevel?: CulturalLevel;

  @IsOptional()
  @IsString()
  profileVisibility?: string;

  @IsOptional()
  @IsString()
  themeColor?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsObject()
  interests?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}