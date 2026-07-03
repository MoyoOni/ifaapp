import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}