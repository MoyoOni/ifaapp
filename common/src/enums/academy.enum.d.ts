export declare enum CourseStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    ARCHIVED = "ARCHIVED"
}
export declare enum LessonType {
    VIDEO = "VIDEO",
    AUDIO = "AUDIO",
    TEXT = "TEXT",
    QUIZ = "QUIZ"
}
export declare enum EnrollmentStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum CourseLevel {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED"
}
export type CourseStatusType = keyof typeof CourseStatus;
export type LessonTypeType = keyof typeof LessonType;
export type EnrollmentStatusType = keyof typeof EnrollmentStatus;
export type CourseLevelType = keyof typeof CourseLevel;
