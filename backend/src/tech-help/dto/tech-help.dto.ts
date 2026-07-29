import { IsString, MinLength } from 'class-validator';

export class AskTechHelpDto {
  @IsString()
  @MinLength(5)
  question!: string;
}

export class AnswerTechHelpDto {
  @IsString()
  @MinLength(1)
  answer!: string;
}
