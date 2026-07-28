import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

// VENDOR_BACKLOG.md VND-010: a fixed, rule-based set rather than freeform
// text -- lets "most common return reasons" analytics be an honest count
// instead of fuzzy string clustering.
export enum ReturnReasonCategory {
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  DAMAGED_DEFECTIVE = 'DAMAGED_DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  CHANGED_MIND = 'CHANGED_MIND',
  OTHER = 'OTHER',
}

export enum ReturnDecision {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

export class CreateReturnRequestDto {
  @IsEnum(ReturnReasonCategory)
  declare reasonCategory: ReturnReasonCategory;

  @IsString()
  @MinLength(10)
  declare reason: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  declare photos?: string[];
}

export class RespondToReturnRequestDto {
  @IsEnum(ReturnDecision)
  declare decision: ReturnDecision;

  @IsString()
  @IsOptional()
  declare vendorResponse?: string;

  // Required by the service when accepting a return that includes a
  // PHYSICAL product -- validated there, not here, since it depends on
  // the order's contents.
  @IsString()
  @IsOptional()
  declare returnAddress?: string;

  // Required by the service when decision is PARTIAL_REFUND.
  @IsNumber()
  @Min(0)
  @IsOptional()
  declare offeredRefundAmount?: number;
}

export class EscalateReturnRequestDto {
  @IsString()
  @MinLength(20)
  declare description: string;
}
