"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseCertificateSchema = exports.LessonCompletionSchema = exports.EnrollmentSchema = exports.LessonSchema = exports.CourseSchema = void 0;
const zod_1 = require("zod");
const academy_enum_js_1 = require("../enums/academy.enum.js");
exports.CourseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    instructorId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    level: zod_1.z.nativeEnum(academy_enum_js_1.CourseLevel),
    thumbnail: zod_1.z.string().url().optional(),
    duration: zod_1.z.number().int().positive().nullable(),
    price: zod_1.z.number().nonnegative(),
    currency: zod_1.z.string().default('NGN'),
    status: zod_1.z.nativeEnum(academy_enum_js_1.CourseStatus),
    approvedBy: zod_1.z.string().uuid().optional(),
    enrolledCount: zod_1.z.number().int().nonnegative().default(0),
    lessonCount: zod_1.z.number().int().nonnegative().default(0),
    certificateEnabled: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.LessonSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    courseId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    order: zod_1.z.number().int().nonnegative(),
    type: zod_1.z.nativeEnum(academy_enum_js_1.LessonType),
    content: zod_1.z.string().optional(),
    videoUrl: zod_1.z.string().url().optional(),
    audioUrl: zod_1.z.string().url().optional(),
    duration: zod_1.z.number().int().positive().nullable(),
    resources: zod_1.z.array(zod_1.z.string().url()),
    status: zod_1.z.string().default('DRAFT'),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.EnrollmentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    courseId: zod_1.z.string().uuid(),
    studentId: zod_1.z.string().uuid(),
    status: zod_1.z.nativeEnum(academy_enum_js_1.EnrollmentStatus),
    progress: zod_1.z.number().min(0).max(100).default(0),
    enrolledAt: zod_1.z.date(),
    completedAt: zod_1.z.date().nullable(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.LessonCompletionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    enrollmentId: zod_1.z.string().uuid(),
    lessonId: zod_1.z.string().uuid(),
    completedAt: zod_1.z.date()
});
exports.CourseCertificateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    enrollmentId: zod_1.z.string().uuid(),
    certificateUrl: zod_1.z.string().url(),
    issuedAt: zod_1.z.date()
});
//# sourceMappingURL=academy.schema.js.map