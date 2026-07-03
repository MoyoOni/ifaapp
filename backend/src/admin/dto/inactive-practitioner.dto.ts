import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export enum ReEngagementAction {
  SEND_MESSAGE = 'SEND_MESSAGE',
  MARK_ON_LEAVE = 'MARK_ON_LEAVE',
  DEACTIVATE_LISTING = 'DEACTIVATE_LISTING',
}

export class InactivePractitionerDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  lastLoginAt?: string;

  @IsOptional()
  @IsString()
  lastBookingAccepted?: string;

  @IsOptional()
  @IsBoolean()
  isOnLeave?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeactivated?: boolean;

  constructor({
    id,
    name,
    email,
    lastLoginAt,
    lastBookingAccepted,
    isOnLeave,
    isDeactivated,
  }: Partial<InactivePractitionerDto> = {}) {
    this.id = id!;
    this.name = name!;
    this.email = email!;
    this.lastLoginAt = lastLoginAt ?? undefined;
    this.lastBookingAccepted = lastBookingAccepted ?? undefined;
    this.isOnLeave = isOnLeave ?? undefined;
    this.isDeactivated = isDeactivated ?? undefined;
  }
}

export class ReEngagementActionDto {
  @IsString()
  practitionerId!: string;

  @IsEnum(ReEngagementAction)
  action!: ReEngagementAction;

  @IsOptional()
  @IsString()
  message?: string;
}