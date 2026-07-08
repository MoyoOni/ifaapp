import { IsOptional, IsString } from 'class-validator';

export class UnbanUserDto {
  @IsString()
  @IsOptional()
  declare reason?: string;
}
