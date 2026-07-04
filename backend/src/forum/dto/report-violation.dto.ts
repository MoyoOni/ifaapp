import { IsEnum, IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export enum ReportCategory {
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  VIOLATION_OF_GUIDELINES = 'violation_of_guidelines',
  FRAUD = 'fraud',
  HATE_SPEECH = 'hate_speech',
  CRISIS_SIGNAL = 'crisis_signal',
  SACRED_KNOWLEDGE_MISUSE = 'sacred_knowledge_misuse',
  PRIVACY_VIOLATION = 'privacy_violation',
  OTHER = 'other',
}

export enum ReportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class ReportViolationDto {
  @IsEnum(ReportCategory)
  declare category: ReportCategory;

  @IsEnum(ReportPriority)
  @IsOptional()
  declare priority?: ReportPriority;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  declare description: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  declare additionalContext?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  declare evidenceUrl?: string;
}
