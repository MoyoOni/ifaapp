import { IsString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { Platform } from '../push/push-notification.service';

export class RegisterDeviceTokenDto {
  @IsString()
  token!: string;

  @IsEnum(Platform)
  platform!: Platform;

  @IsString()
  @IsOptional()
  deviceType?: string;

  @IsObject()
  @IsOptional()
  deviceInfo?: any;
}
