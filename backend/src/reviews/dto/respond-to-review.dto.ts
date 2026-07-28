import { IsString, MinLength, MaxLength } from 'class-validator';

// VENDOR_BACKLOG.md VND-022: a vendor's public reply to a customer review.
export class RespondToReviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  declare response: string;
}
