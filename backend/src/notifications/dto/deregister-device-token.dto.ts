import { IsString } from 'class-validator';

export class DeregisterDeviceTokenDto {
  @IsString()
  declare token: string;
}
