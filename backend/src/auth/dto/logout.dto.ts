import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh token of the session being ended. Lets a client whose access token has already expired still revoke its session.',
  })
  @IsString()
  @IsOptional()
  declare refreshToken?: string;
}
