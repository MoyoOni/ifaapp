import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const CRISIS_OUTCOMES = ['REACHED_OUT', 'REFERRED', 'NO_RESPONSE', 'FALSE_ALARM'] as const;
export type CrisisOutcome = (typeof CRISIS_OUTCOMES)[number];

export class ResolveCrisisSignalDto {
  @IsIn(CRISIS_OUTCOMES)
  outcome!: CrisisOutcome;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
