export class CreateFeatureFlagDto {
  key!: string;
  enabled!: boolean;
  description?: string;
  rolloutPercentage?: number;
  targeting?: any;
}

export class UpdateFeatureFlagDto {
  enabled?: boolean;
  description?: string;
  rolloutPercentage?: number;
  targeting?: any;
}

export class ToggleUserOverrideDto {
  userId!: string;
  enabled!: boolean;
}