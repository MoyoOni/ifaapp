import { Test, TestingModule } from '@nestjs/testing';
import { AcademyService } from './academy.service';
import { PrismaService } from '../prisma/prisma.service';
import { CertificateService } from '../certificates/certificate.service';
import { UsersService } from '../users/users.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

jest.mock('@ile-ase/common', () => {
  const actual = jest.requireActual('@ile-ase/common');
  return {
    ...actual,
    CourseLevel: { BEGINNER: 'BEGINNER', INTERMEDIATE: 'INTERMEDIATE', ADVANCED: 'ADVANCED' },
    CourseStatus: { DRAFT: 'DRAFT', APPROVED: 'APPROVED', REJECTED: 'REJECTED' },
    LessonType: { VIDEO: 'VIDEO', TEXT: 'TEXT', QUIZ: 'QUIZ' },
    EnrollmentStatus: { ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' },
  };
});

describe('AcademyService', () => {
  let service: AcademyService;

  const mockPrismaService = {
    course: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    lesson: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    enrollment: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockCurrentUser = {
    id: 'instructor-1',
    sub: 'instructor-1',
    email: 'instructor@example.com',
    role: 'BABALAWO' as any,
    verified: true,
  };

  const mockCertificateService = {
    issueCertificate: jest.fn(),
    getCertificate: jest.fn(),
  };

  const mockUsersService = {
    awardXP: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CertificateService, useValue: mockCertificateService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AcademyService>(AcademyService);
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    // Course creation is admin-only (babalawo self-service submission was
    // removed) -- mockCurrentUser above is BABALAWO, shared with tests
    // elsewhere in this file that aren't about course-creation permissions,
    // so this test uses its own admin-role user rather than changing the
    // shared fixture's role.
    const mockAdminUser = {
      ...mockCurrentUser,
      id: 'admin-1',
      sub: 'admin-1',
      role: 'ADMIN' as any,
    };

    it('should create a course when called by an admin', async () => {
      const dto = {
        title: 'Introduction to Ifa',
        slug: 'intro-to-ifa',
        description: 'Learn the basics',
        category: 'DIVINATION' as any,
      };

      const mockCourse = { id: 'course-1', ...dto, instructorId: mockAdminUser.id };
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      mockPrismaService.course.create.mockResolvedValue(mockCourse);

      const result = await service.createCourse(dto as any, mockAdminUser);

      expect(result).toEqual(mockCourse);
    });

    it('should reject a non-admin (e.g. babalawo) trying to create a course', async () => {
      const dto = {
        title: 'Introduction to Ifa',
        slug: 'intro-to-ifa',
        description: 'Learn the basics',
        category: 'DIVINATION' as any,
      };

      await expect(service.createCourse(dto as any, mockCurrentUser)).rejects.toThrow(
        'Only admins can create courses'
      );
    });
  });

  describe('findAllCourses', () => {
    it('should return all courses', async () => {
      const mockCourses = [{ id: 'course-1', title: 'Course 1' }];
      mockPrismaService.course.findMany.mockResolvedValue(mockCourses);

      const result = await service.findAllCourses();

      expect(result).toEqual(mockCourses);
    });
  });

  describe('findCourseById', () => {
    it('should return course by ID', async () => {
      const mockCourse = { id: 'course-1', title: 'Course 1' };
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findCourseById('course-1');

      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException when course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(service.findCourseById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('security: never requests videoUrl/audioUrl/content/resources on the public course-detail embedded lessons (findCourseById is @Public, unauthenticated, and unaware of Devoted status)', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({ id: 'course-1' });

      await service.findCourseById('course-1');

      const call = mockPrismaService.course.findUnique.mock.calls[0][0];
      const lessonSelect = call.include.lessons.select;
      expect(lessonSelect).toEqual({
        id: true,
        title: true,
        order: true,
        type: true,
        duration: true,
        status: true,
      });
      expect(lessonSelect.videoUrl).toBeUndefined();
      expect(lessonSelect.audioUrl).toBeUndefined();
      expect(lessonSelect.content).toBeUndefined();
      expect(lessonSelect.resources).toBeUndefined();
    });
  });

  describe('findCourseBySlug', () => {
    it('security: never requests videoUrl/audioUrl/content/resources on the public course-detail embedded lessons', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({ id: 'course-1' });

      await service.findCourseBySlug('some-slug');

      const call = mockPrismaService.course.findUnique.mock.calls[0][0];
      const lessonSelect = call.include.lessons.select;
      expect(lessonSelect.videoUrl).toBeUndefined();
      expect(lessonSelect.audioUrl).toBeUndefined();
      expect(lessonSelect.content).toBeUndefined();
    });
  });

  describe('createEnrollment', () => {
    it('should enroll user in course', async () => {
      const dto = { courseId: 'course-1' };
      const mockEnrollment = { id: 'enroll-1', ...dto, userId: mockCurrentUser.id };

      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        sub: 'course-1',
        status: 'APPROVED',
      });
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
      mockPrismaService.enrollment.create.mockResolvedValue(mockEnrollment);
      mockPrismaService.enrollment.count.mockResolvedValue(1);
      mockPrismaService.course.update.mockResolvedValue({});

      const result = await service.createEnrollment(dto as any, mockCurrentUser);

      expect(result).toEqual(mockEnrollment);
    });

    it('V8_MONETISATION_BACKLOG.md V8-203: rejects enrolling a FREE user into a Devoted-only course', async () => {
      const dto = { courseId: 'course-1' };
      const freeClient = { ...mockCurrentUser, id: 'client-1', role: 'CLIENT' as any };

      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        isDevoted: true,
        instructorId: 'instructor-1',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'FREE' });

      await expect(service.createEnrollment(dto as any, freeClient)).rejects.toThrow(ForbiddenException);
    });

    it('V8_MONETISATION_BACKLOG.md V8-203: allows a DEVOTED user to enroll in a Devoted-only course', async () => {
      const dto = { courseId: 'course-1' };
      const devotedClient = { ...mockCurrentUser, id: 'client-1', role: 'CLIENT' as any };
      const mockEnrollment = { id: 'enroll-1', ...dto, userId: devotedClient.id };

      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        isDevoted: true,
        instructorId: 'instructor-1',
        status: 'APPROVED',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'DEVOTED' });
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
      mockPrismaService.enrollment.create.mockResolvedValue(mockEnrollment);
      mockPrismaService.enrollment.count.mockResolvedValue(1);
      mockPrismaService.course.update.mockResolvedValue({});

      const result = await service.createEnrollment(dto as any, devotedClient);

      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('findAllLessons / findLessonById (V8_MONETISATION_BACKLOG.md V8-203)', () => {
    const freeClient = { ...mockCurrentUser, id: 'client-1', role: 'CLIENT' as any };

    it('findAllLessons rejects a FREE user reading a Devoted-only course directly', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        isDevoted: true,
        instructorId: 'instructor-1',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'FREE' });

      await expect(service.findAllLessons('course-1', freeClient)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.lesson.findMany).not.toHaveBeenCalled();
    });

    it('findAllLessons allows any user through for a non-Devoted course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        isDevoted: false,
        instructorId: 'instructor-1',
      });
      mockPrismaService.lesson.findMany.mockResolvedValue([{ id: 'lesson-1' }]);

      const result = await service.findAllLessons('course-1', freeClient);

      expect(result).toEqual([{ id: 'lesson-1' }]);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('findAllLessons allows the course instructor through regardless of their own subscription status', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        isDevoted: true,
        instructorId: 'instructor-1',
      });
      mockPrismaService.lesson.findMany.mockResolvedValue([{ id: 'lesson-1' }]);

      const result = await service.findAllLessons('course-1', mockCurrentUser);

      expect(result).toEqual([{ id: 'lesson-1' }]);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('findAllLessons allows ADMIN through regardless of subscription status', async () => {
      const admin = { ...mockCurrentUser, id: 'admin-1', role: 'ADMIN' as any };
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        isDevoted: true,
        instructorId: 'instructor-1',
      });
      mockPrismaService.lesson.findMany.mockResolvedValue([{ id: 'lesson-1' }]);

      const result = await service.findAllLessons('course-1', admin);

      expect(result).toEqual([{ id: 'lesson-1' }]);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('findLessonById rejects a FREE user reading a lesson from a Devoted-only course directly', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({
        id: 'lesson-1',
        course: { id: 'course-1', title: 'Course', instructorId: 'instructor-1', isDevoted: true },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'FREE' });

      await expect(service.findLessonById('lesson-1', freeClient)).rejects.toThrow(ForbiddenException);
    });

    it('findLessonById allows a DEVOTED user through', async () => {
      const lesson = {
        id: 'lesson-1',
        course: { id: 'course-1', title: 'Course', instructorId: 'instructor-1', isDevoted: true },
      };
      mockPrismaService.lesson.findUnique.mockResolvedValue(lesson);
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'DEVOTED' });

      const result = await service.findLessonById('lesson-1', freeClient);

      expect(result).toEqual(lesson);
    });
  });

  describe('deleteLesson (ProBacklog-v1.md item #12: soft-delete audit)', () => {
    const instructorUser = { ...mockCurrentUser, id: 'instructor-1', role: 'BABALAWO' as any };

    it('soft-deletes by setting deletedAt instead of calling prisma delete', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({
        id: 'lesson-1',
        courseId: 'course-1',
        course: { instructorId: 'instructor-1' },
      });
      mockPrismaService.lesson.update.mockResolvedValue({ id: 'lesson-1' });
      mockPrismaService.lesson.count.mockResolvedValue(0);
      mockPrismaService.course.update.mockResolvedValue({});

      await service.deleteLesson('lesson-1', instructorUser);

      expect(mockPrismaService.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.lesson.count.mock.calls[0][0].where.deletedAt).toBeNull();
    });

    it('404s on an already-deleted lesson instead of re-timestamping it', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(service.deleteLesson('lesson-1', instructorUser)).rejects.toThrow(NotFoundException);
      const call = mockPrismaService.lesson.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });
  });

  describe('lesson read paths filter out soft-deleted lessons', () => {
    it('findAllLessons', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        isDevoted: false,
        instructorId: 'instructor-1',
      });
      mockPrismaService.lesson.findMany.mockResolvedValue([]);

      await service.findAllLessons('course-1', mockCurrentUser);

      expect(mockPrismaService.lesson.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });
  });

  describe('findAllEnrollments', () => {
    it('should return user enrollments', async () => {
      const mockEnrollments = [{ id: 'enroll-1', userId: mockCurrentUser.id }];
      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.findAllEnrollments(mockCurrentUser);

      expect(result).toEqual(mockEnrollments);
    });
  });
});
