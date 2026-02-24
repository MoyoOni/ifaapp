/**
 * Forum Status Enums
 * Status values for threads and posts
 */

export enum ThreadStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  PINNED = 'PINNED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum PostStatus {
  ACTIVE = 'ACTIVE',
  EDITED = 'EDITED',
  DELETED = 'DELETED',
  HIDDEN = 'HIDDEN',
}

export type ThreadStatusType = keyof typeof ThreadStatus;
export type PostStatusType = keyof typeof PostStatus;
