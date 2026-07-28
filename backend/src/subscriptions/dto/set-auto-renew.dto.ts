import { IsBoolean } from 'class-validator';

export class SetAutoRenewDto {
  @IsBoolean({ message: 'autoRenew must be a boolean' })
  autoRenew!: boolean;
}
