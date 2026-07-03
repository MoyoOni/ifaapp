import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsISO8601 } from 'class-validator';

export enum PreferredMethod {
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
  IN_PERSON = 'IN_PERSON',
}

export enum PaymentMethod {
  WALLET = 'WALLET',
  CARD = 'CARD',
  ESCROW = 'ESCROW',
}

export class CreateAppointmentDto {
  @IsString()
  babalawoId!: string; // Required: Babalawo's ID

  @IsString()
  clientId!: string; // Required: Client's ID

  @IsString()
  @IsISO8601()
  date!: string; // ISO date string (YYYY-MM-DD)

  @IsString()
  time!: string; // HH:mm format (24-hour)

  @IsString()
  topic!: string; // What the consultation is about (e.g., "Love & Relationships", "Career Guidance")

  @IsEnum(PreferredMethod)
  preferredMethod!: PreferredMethod; // PHONE | VIDEO | IN_PERSON

  @IsString()
  @IsOptional()
  timezone?: string; // Defaults to Africa/Lagos (WAT)

  @IsNumber()
  @IsOptional()
  @Min(30) // Minimum 30 minutes
  @Max(480) // Maximum 8 hours
  duration?: number; // Minutes (default 60)

  @IsNumber()
  @IsOptional()
  price?: number; // Service price in NGN

  @IsString()
  @IsOptional()
  specialRequests?: string; // Any special requests or notes

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod; // How payment will be made
}
