import { IsString, IsOptional } from 'class-validator';

export class RequestCheckInDto {
  @IsString()
  @IsOptional()
  message?: string;
}
