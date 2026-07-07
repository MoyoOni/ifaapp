import { IsBoolean } from 'class-validator';

export class UpdateFlagRuleDto {
  @IsBoolean()
  declare isActive: boolean;
}