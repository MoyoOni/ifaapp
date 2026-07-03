import { IsEnum } from 'class-validator';

export class InitiateSubscriptionDto {
  @IsEnum(['QUARTERLY', 'ANNUAL'], {
    message: 'plan must be QUARTERLY or ANNUAL',
  })
  plan!: 'QUARTERLY' | 'ANNUAL';
}
