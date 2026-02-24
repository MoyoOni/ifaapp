import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, CulturalLevel } from '@ile-ase/common';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  declare name: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  declare password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.CLIENT })
  @IsEnum(UserRole)
  declare role: UserRole;

  @ApiPropertyOptional({ example: 'Olawale' })
  @IsString()
  @IsOptional()
  declare yorubaName?: string;

  @ApiPropertyOptional({ enum: CulturalLevel })
  @IsEnum(CulturalLevel)
  @IsOptional()
  declare culturalLevel?: CulturalLevel;
}
