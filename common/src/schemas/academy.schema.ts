import { z } from 'zod';
import { CourseStatus, LessonType, EnrollmentStatus, CourseLevel } from '../enums/academy.enum.js';

/**
 * Course Schema
 * Structured learning course (requires Community Advisory Council approval)
 */
export const CourseSchema = z.object({
  id: z.string().uuid(),
  instructorId: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1), // foundational, spiritual_practice, advanced_priestly, cultural_studies
  level: z.nativeEnum(CourseLevel),
  thumbnail: z.string().url().optional(),
  duration: z.number().int().positive().nullable(), // Estimated hours
  price: z.number().nonnegative(),
  currency: z.string().default('NGN'),
  status: z.nativeEnum(CourseStatus),
  approvedBy: z.string().uuid().optional(),
  enrolledCount: z.number().int().nonnegative().default(0),
  lessonCount: z.number().int().nonnegative().default(0),
  certificateEnabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Course = z.infer<typeof CourseSchema>;

/**
 * Lesson Schema
 * Individual lesson within a course
 */
export const LessonSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  type: z.nativeEnum(LessonType),
  content: z.string().optional(), // Text content or transcript
  videoUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional(),
  duration: z.number().int().positive().nullable(), // Minutes
  resources: z.array(z.string().url()),
  status: z.string().default('DRAFT'), // DRAFT, PUBLISHED
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Lesson = z.infer<typeof LessonSchema>;

/**
 * Enrollment Schema
 * Student course enrollment
 */
export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.nativeEnum(EnrollmentStatus),
  progress: z.number().min(0).max(100).default(0), // 0-100 percentage
  enrolledAt: z.date(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Enrollment = z.infer<typeof EnrollmentSchema>;

/**
 * Lesson Completion Schema
 * Track lesson progress for enrolled students
 */
export const LessonCompletionSchema = z.object({
  id: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  lessonId: z.string().uuid(),
  completedAt: z.date()
});

export type LessonCompletion = z.infer<typeof LessonCompletionSchema>;

/**
 * Course Certificate Schema
 * Certificate of completion for a course
 */
export const CourseCertificateSchema = z.object({
  id: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  certificateUrl: z.string().url(),
  issuedAt: z.date()
});

export type CourseCertificate = z.infer<typeof CourseCertificateSchema>;
