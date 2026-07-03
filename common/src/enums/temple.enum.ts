/**
 * Temple Type Enumeration
 * Defines the types of temples in the Ilé Àṣẹ platform
 */
export enum TempleType {
  ILE_IFA = 'ILE_IFA',
  BRANCH = 'BRANCH',
  STUDY_CIRCLE = 'STUDY_CIRCLE',
}

export type TempleTypeType = keyof typeof TempleType;

/**
 * Temple Status Enumeration
 * Defines the status of temples
 */
export enum TempleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export type TempleStatusType = keyof typeof TempleStatus;
