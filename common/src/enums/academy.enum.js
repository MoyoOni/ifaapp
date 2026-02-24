"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseLevel = exports.EnrollmentStatus = exports.LessonType = exports.CourseStatus = void 0;
var CourseStatus;
(function (CourseStatus) {
    CourseStatus["DRAFT"] = "DRAFT";
    CourseStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    CourseStatus["APPROVED"] = "APPROVED";
    CourseStatus["REJECTED"] = "REJECTED";
    CourseStatus["ARCHIVED"] = "ARCHIVED";
})(CourseStatus || (exports.CourseStatus = CourseStatus = {}));
var LessonType;
(function (LessonType) {
    LessonType["VIDEO"] = "VIDEO";
    LessonType["AUDIO"] = "AUDIO";
    LessonType["TEXT"] = "TEXT";
    LessonType["QUIZ"] = "QUIZ";
})(LessonType || (exports.LessonType = LessonType = {}));
var EnrollmentStatus;
(function (EnrollmentStatus) {
    EnrollmentStatus["ACTIVE"] = "ACTIVE";
    EnrollmentStatus["COMPLETED"] = "COMPLETED";
    EnrollmentStatus["CANCELLED"] = "CANCELLED";
})(EnrollmentStatus || (exports.EnrollmentStatus = EnrollmentStatus = {}));
var CourseLevel;
(function (CourseLevel) {
    CourseLevel["BEGINNER"] = "BEGINNER";
    CourseLevel["INTERMEDIATE"] = "INTERMEDIATE";
    CourseLevel["ADVANCED"] = "ADVANCED";
})(CourseLevel || (exports.CourseLevel = CourseLevel = {}));
//# sourceMappingURL=academy.enum.js.map