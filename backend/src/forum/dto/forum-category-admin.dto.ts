import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateForumCategoryDto {
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsString()
  @IsOptional()
  declare description?: string;

  @IsString()
  @IsOptional()
  declare icon?: string;

  @IsInt()
  @IsOptional()
  declare order?: number;

  @IsBoolean()
  @IsOptional()
  declare isTeachings?: boolean;
}

export class UpdateForumCategoryDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  declare name?: string;

  @IsString()
  @IsOptional()
  declare description?: string;

  @IsString()
  @IsOptional()
  declare icon?: string;

  @IsInt()
  @IsOptional()
  declare order?: number;

  @IsBoolean()
  @IsOptional()
  declare isTeachings?: boolean;

  @IsBoolean()
  @IsOptional()
  declare isActive?: boolean;
}

export class ReorderForumCategoryDto {
  @IsInt()
  declare newPosition: number;
}

export class MoveThreadToCategoryDto {
  @IsString()
  declare targetCategoryId: string;
}

export class FeatureThreadDto {
  @IsBoolean()
  declare isFeatured: boolean;
}

export class MergeThreadsDto {
  @IsString()
  declare primaryThreadId: string;

  @IsString()
  declare secondaryThreadId: string;
}

export class DeleteThreadAdminDto {
  @IsString()
  @IsOptional()
  declare reason?: string;
}
