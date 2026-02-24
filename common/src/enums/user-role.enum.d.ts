export declare enum UserRole {
    CLIENT = "CLIENT",
    BABALAWO = "BABALAWO",
    VENDOR = "VENDOR",
    ADMIN = "ADMIN",
    ADVISORY_BOARD_MEMBER = "ADVISORY_BOARD_MEMBER"
}
export type UserRoleType = keyof typeof UserRole;
