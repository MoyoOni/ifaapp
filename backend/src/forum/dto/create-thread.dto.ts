import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateThreadDto {
  @IsUUID()
  declare categoryId: string;

  @IsString()
  @MinLength(5)
  @MaxLength(250)
  declare title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20_000)
  declare content: string; // First post content

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @ArrayMaxSize(5)
  declare tags?: string[];

  @IsBoolean()
  @IsOptional()
  declare isApproved?: boolean; // False requires moderator approval

  @IsBoolean()
  @IsOptional()
  declare isSacred?: boolean; // Sacred Knowledge tag

  // COMMUNITY_BACKLOG.md FOR-014: "Elder-led discussion series and
  // teachings" -- Babalawo/Admin only, enforced in forum.service.ts.
  @IsBoolean()
  @IsOptional()
  declare isTeachingSeries?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  declare seriesName?: string;
}
