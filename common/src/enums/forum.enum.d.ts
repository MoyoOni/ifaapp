export declare enum ThreadStatus {
    ACTIVE = "ACTIVE",
    LOCKED = "LOCKED",
    PINNED = "PINNED",
    ARCHIVED = "ARCHIVED",
    DELETED = "DELETED"
}
export declare enum PostStatus {
    ACTIVE = "ACTIVE",
    EDITED = "EDITED",
    DELETED = "DELETED",
    HIDDEN = "HIDDEN"
}
export type ThreadStatusType = keyof typeof ThreadStatus;
export type PostStatusType = keyof typeof PostStatus;
