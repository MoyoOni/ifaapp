import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SendConnectionRequestDto {
  @IsString()
  @IsOptional()
  message?: string;
}

export class RespondConnectionRequestDto {
  @IsBoolean()
  accept!: boolean;
}
