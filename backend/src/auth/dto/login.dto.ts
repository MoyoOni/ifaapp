import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com or 08012345678' })
  @IsString()
  declare email: string; // accepts email or phone number

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(6)
  declare password: string;
}
