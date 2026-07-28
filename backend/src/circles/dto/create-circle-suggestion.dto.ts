import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCircleSuggestionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  declare title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  declare description: string;
}
