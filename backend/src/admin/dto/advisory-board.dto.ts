import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export enum RequiredMajority {
  SIMPLE = 'SIMPLE', // 50%
  SUPER = 'SUPER', // 75%
  UNANIMOUS = 'UNANIMOUS', // 100%
}

export class CreateAdvisoryVoteDto {
  @IsString()
  @IsNotEmpty()
  declare title: string;

  @IsString()
  @IsNotEmpty()
  declare description: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  declare voteOptions: string[];

  @IsDateString()
  declare deadline: string;

  @IsEnum(RequiredMajority)
  declare requiredMajority: RequiredMajority;
}

export class CastAdvisoryVoteDto {
  @IsString()
  @IsNotEmpty()
  declare voteId: string;

  @IsString()
  @IsNotEmpty()
  declare option: string;
}
