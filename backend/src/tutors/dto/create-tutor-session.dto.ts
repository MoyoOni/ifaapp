import { IsString, IsUUID, IsInt, Min, IsOptional } from 'class-validator';

/**
 * Create Tutor Session DTO
 * Booking a tutoring session
 */
export class CreateTutorSessionDto {
  @IsUUID()
  declare tutorId: string;

  @IsString()
  declare date: string; // ISO date string

  @IsString()
  declare time: string; // HH:mm format

  @IsString()
  @IsOptional()
  declare timezone?: string;

  @IsInt()
  @Min(15) // Minimum 15 minutes
  declare duration: number; // Minutes

  @IsString()
  @IsOptional()
  declare notes?: string;
}
