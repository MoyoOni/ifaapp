import { IsString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { Platform } from '../push-notification.service';

export class RegisterDeviceTokenDto {
  @IsString()
  token!: string;

  @IsEnum(Platform)
  platform!: Platform;

  @IsObject()
  @IsOptional()
  deviceInfo?: any;
}
