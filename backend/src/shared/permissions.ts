export const Permission = {
  // Forum moderation
  CAN_MODERATE_FORUM: 'canModerateForum',
  CAN_PIN_THREADS: 'canPinThreads',
  CAN_LOCK_THREADS: 'canLockThreads',
  CAN_DELETE_POSTS: 'canDeletePosts',

  // Temple moderation
  CAN_MODERATE_TEMPLE: 'canModerateTemple',
  CAN_MANAGE_TEMPLE_MEMBERS: 'canManageTempleMembers',

  // Content
  CAN_FEATURE_CONTENT: 'canFeatureContent',
  CAN_REVIEW_CONTENT: 'canReviewContent',

  // Elder oversight (D2)
  CAN_ENDORSE_THREADS: 'canEndorseThreads',
  CAN_FLAG_DISPUTES: 'canFlagDisputes',

  // Platform settings (read-only admin views)
  CAN_VIEW_ANALYTICS: 'canViewAnalytics',
  CAN_MANAGE_EVENTS: 'canManageEvents',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS = Object.values(Permission);
