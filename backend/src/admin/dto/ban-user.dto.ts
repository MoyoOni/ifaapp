import { IsString, IsOptional } from 'class-validator';

export class BanUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}