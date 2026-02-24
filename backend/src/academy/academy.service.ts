import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CourseStatus, LessonType, EnrollmentStatus, CourseLevel } from '@ile-ase/common';

/**
 * Academy Service
 * Course management, enrollment, progress tracking, and certificate generation
 * NOTE: All courses require Community Advisory Council approval
 */
@Injectable()
export class AcademyService {
  constructor(private prisma: PrismaService) {}

  // ==================== Courses ====================

  async createCourse(dto: CreateCourseDto, currentUser: CurrentUserPayload) {
    // Verify user can create courses (verified trainer/Babalawo or admin)
    if (currentUser.role !== 'BABALAWO' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only verified trainers (Babalawos) can create courses');
    }

    // Check if slug already exists
    const existingCourse = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
    });

    if (existingCourse) {
      throw new BadRequestException('A course with this slug already exists');
    }

    return this.prisma.course.create({
      data: {
        instructorId: currentUser.id,
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        category: dto.category,
        level: dto.level || CourseLevel.BEGINNER,
        thumbnail: dto.thumbnail,
        duration: dto.duration,
        price: dto.price || 0,
        currency: dto.currency || 'NGN',
        status: CourseStatus.DRAFT, // Requires approval
        certificateEnabled: dto.certificateEnabled !== undefined ? dto.certificateEnabled : true,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
      },
    });
  }

  async findAllCourses(instructorId?: string, category?: string, status?: CourseStatus) {
    const where: any = {};

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    } else {
      // Default: only show approved courses
      where.status = CourseStatus.APPROVED;
    }

    return this.prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCourseById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
        lessons: {
          where: { status: 'PUBLISHED' },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findCourseBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
        lessons: {
          where: { status: 'PUBLISHED' },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto, currentUser: CurrentUserPayload) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Only instructor or admin can update
    if (currentUser.role !== 'ADMIN' && course.instructorId !== currentUser.id) {
      throw new ForbiddenException('You can only update your own courses');
    }

    // Only admin can change status (approve/reject)
    if (dto.status && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change course status');
    }

    const updateData: any = { ...dto };
    delete updateData.status; // Handle status separately

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === CourseStatus.APPROVED) {
        updateData.approvedBy = currentUser.id;
      }
    }

    // Update lesson count cache
    if (updateData.title || updateData.description) {
      const lessonCount = await this.prisma.lesson.count({
        where: { courseId },
      });
      updateData.lessonCount = lessonCount;
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
      },
    });
  }

  // ==================== Lessons ====================

  async createLesson(courseId: string, dto: CreateLessonDto, currentUser: CurrentUserPayload) {
    // Verify course exists and user is instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (currentUser.role !== 'ADMIN' && course.instructorId !== currentUser.id) {
      throw new ForbiddenException('You can only add lessons to your own courses');
    }

    // Get max order for lessons in this course
    const maxOrderLesson = await this.prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const order = dto.order || (maxOrderLesson ? maxOrderLesson.order + 1 : 0);

    const lesson = await this.prisma.lesson.create({
      data: {
        courseId,
        title: dto.title,
        order,
        type: dto.type || LessonType.VIDEO,
        content: dto.content,
        videoUrl: dto.videoUrl,
        audioUrl: dto.audioUrl,
        duration: dto.duration,
        resources: dto.resources || [],
        status: 'DRAFT',
      },
    });

    // Update course lesson count
    const lessonCount = await this.prisma.lesson.count({
      where: { courseId },
    });
    await this.prisma.course.update({
      where: { id: courseId },
      data: { lessonCount },
    });

    return lesson;
  }

  async findAllLessons(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }

  async findLessonById(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto, currentUser: CurrentUserPayload) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Only instructor or admin can update
    if (currentUser.role !== 'ADMIN' && lesson.course.instructorId !== currentUser.id) {
      throw new ForbiddenException('You can only update lessons in your own courses');
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: dto,
    });
  }

  async deleteLesson(lessonId: string, currentUser: CurrentUserPayload) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Only instructor or admin can delete
    if (currentUser.role !== 'ADMIN' && lesson.course.instructorId !== currentUser.id) {
      throw new ForbiddenException('You can only delete lessons in your own courses');
    }

    await this.prisma.lesson.delete({
      where: { id: lessonId },
    });

    // Update course lesson count
    const lessonCount = await this.prisma.lesson.count({
      where: { courseId: lesson.courseId },
    });
    await this.prisma.course.update({
      where: { id: lesson.courseId },
      data: { lessonCount },
    });

    return { message: 'Lesson deleted successfully' };
  }

  // ==================== Enrollments ====================

  async createEnrollment(dto: CreateEnrollmentDto, currentUser: CurrentUserPayload) {
    // Verify course exists and is approved
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.status !== CourseStatus.APPROVED) {
      throw new BadRequestException('Course is not available for enrollment');
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: dto.courseId,
          studentId: currentUser.id,
        },
      },
    });

    if (existingEnrollment) {
      throw new BadRequestException('You are already enrolled in this course');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        courseId: dto.courseId,
        studentId: currentUser.id,
        status: EnrollmentStatus.ACTIVE,
        progress: 0,
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
              },
            },
          },
        },
      },
    });

    // Update course enrollment count
    const enrolledCount = await this.prisma.enrollment.count({
      where: { courseId: dto.courseId },
    });
    await this.prisma.course.update({
      where: { id: dto.courseId },
      data: { enrolledCount },
    });

    return enrollment;
  }

  async findAllEnrollments(currentUser: CurrentUserPayload, courseId?: string) {
    const where: any = {};

    if (currentUser.role === 'BABALAWO' || currentUser.role === 'ADMIN') {
      // Instructors see enrollments for their courses
      if (courseId) {
        where.courseId = courseId;
      } else {
        const courses = await this.prisma.course.findMany({
          where: { instructorId: currentUser.id },
          select: { id: true },
        });
        where.courseId = { in: courses.map((c: any) => c.id) };
      }
    } else {
      // Students see their own enrollments
      where.studentId = currentUser.id;
      if (courseId) {
        where.courseId = courseId;
      }
    }

    return this.prisma.enrollment.findMany({
      where,
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findEnrollmentById(enrollmentId: string, currentUser: CurrentUserPayload) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
              },
            },
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order: 'asc' },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        certificate: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Check access
    if (
      currentUser.role !== 'ADMIN' &&
      enrollment.studentId !== currentUser.id &&
      enrollment.course.instructorId !== currentUser.id
    ) {
      throw new ForbiddenException('You do not have access to this enrollment');
    }

    return enrollment;
  }

  async updateEnrollment(
    enrollmentId: string,
    dto: UpdateEnrollmentDto,
    currentUser: CurrentUserPayload
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Only student, instructor, or admin can update
    if (
      currentUser.role !== 'ADMIN' &&
      enrollment.studentId !== currentUser.id &&
      enrollment.course.instructorId !== currentUser.id
    ) {
      throw new ForbiddenException('You cannot update this enrollment');
    }

    const updateData: any = { ...dto };

    // If status changed to COMPLETED, set completedAt and generate certificate if enabled
    if (
      dto.status === EnrollmentStatus.COMPLETED &&
      enrollment.status !== EnrollmentStatus.COMPLETED
    ) {
      updateData.completedAt = new Date();

      // Generate certificate if enabled
      if (enrollment.course.certificateEnabled) {
        // In a real implementation, you would generate a PDF certificate here
        // For now, we'll create a placeholder certificate URL
        const certificateUrl = `https://s3.example.com/certificates/${enrollmentId}.pdf`; // TODO: Generate actual certificate

        await this.prisma.courseCertificate.create({
          data: {
            enrollmentId: enrollment.id,
            certificateUrl,
          },
        });
      }
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
      include: {
        course: true,
        certificate: true,
      },
    });
  }

  // ==================== Lesson Completions ====================

  async completeLesson(
    dto: CompleteLessonDto,
    enrollmentId: string,
    currentUser: CurrentUserPayload
  ) {
    // Verify enrollment exists and belongs to user
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (currentUser.role !== 'ADMIN' && enrollment.studentId !== currentUser.id) {
      throw new ForbiddenException('You can only complete lessons in your own enrollments');
    }

    // Verify lesson exists and belongs to the course
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
    });

    if (!lesson || lesson.courseId !== enrollment.courseId) {
      throw new NotFoundException('Lesson not found in this course');
    }

    // Check if already completed
    const existingCompletion = await this.prisma.lessonCompletion.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId: dto.lessonId,
        },
      },
    });

    if (existingCompletion) {
      throw new BadRequestException('Lesson already completed');
    }

    // Create completion
    await this.prisma.lessonCompletion.create({
      data: {
        enrollmentId,
        lessonId: dto.lessonId,
      },
    });

    // Calculate and update progress
    const totalLessons = await this.prisma.lesson.count({
      where: { courseId: enrollment.courseId, status: 'PUBLISHED' },
    });

    const completedLessons = await this.prisma.lessonCompletion.count({
      where: { enrollmentId },
    });

    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment progress
    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress },
    });

    // If progress is 100%, mark as completed
    if (progress >= 100 && updatedEnrollment.status !== EnrollmentStatus.COMPLETED) {
      return this.updateEnrollment(
        enrollmentId,
        { status: EnrollmentStatus.COMPLETED },
        currentUser
      );
    }

    return updatedEnrollment;
  }

  async getLessonCompletions(enrollmentId: string) {
    return this.prisma.lessonCompletion.findMany({
      where: { enrollmentId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }
}
