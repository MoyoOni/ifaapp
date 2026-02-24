import { IsString, IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class CreateThreadDto {
  @IsUUID()
  declare categoryId: string;

  @IsString()
  declare title: string;

  @IsString()
  declare content: string; // First post content

  @IsBoolean()
  @IsOptional()
  declare isApproved?: boolean; // False requires moderator approval
}
