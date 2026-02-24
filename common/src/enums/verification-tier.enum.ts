/**
 * Verification Tier Enumeration
 * Three-tier system reflecting traditional Ifá priesthood grades
 */
export enum VerificationTier {
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  MASTER = 'MASTER'
}

export type VerificationTierType = keyof typeof VerificationTier;
