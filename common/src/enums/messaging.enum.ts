/**
 * Messaging Enums
 * Privacy levels and message settings
 */

export enum PrivacyLevel {
  PUBLIC = 'PUBLIC', // Visible to all (not recommended for sensitive topics)
  COMMUNITY = 'COMMUNITY', // Visible within community/forum
  PRIVATE = 'PRIVATE', // Default - visible only to sender and receiver
  CONFIDENTIAL = 'CONFIDENTIAL', // Highest privacy - hidden from activity feed, auto-delete enabled
}

export enum AutoDeleteDays {
  NEVER = 0, // 0 means no auto-delete
  SEVEN_DAYS = 7,
  THIRTY_DAYS = 30,
  NINETY_DAYS = 90,
}
