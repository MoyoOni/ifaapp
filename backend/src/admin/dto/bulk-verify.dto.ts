import { IsArray, IsString, IsIn, IsOptional } from 'class-validator';

export class BulkVerifyDto {
  @IsArray()
  @IsString({ each: true })
  declare appIds: string[];

  @IsIn(['approve', 'decline'])
  declare action: 'approve' | 'decline';

  @IsOptional()
  @IsString()
  declare note?: string;
}
