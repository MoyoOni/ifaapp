import { Test, TestingModule } from '@nestjs/testing';
import { AcademyService } from './academy.service';
import { PrismaService } from '../prisma/prisma.service';
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
    let prisma: PrismaService;

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
        },
        enrollment: {
            create: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
    };

    const mockCurrentUser = {
        id: 'instructor-1',
        email: 'instructor@example.com',
        role: 'BABALAWO' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AcademyService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<AcademyService>(AcademyService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('createCourse', () => {
        it('should create a course', async () => {
            const dto = {
                title: 'Introduction to Ifa',
                slug: 'intro-to-ifa',
                description: 'Learn the basics',
                category: 'DIVINATION' as any,
            };

            const mockCourse = { id: 'course-1', ...dto, instructorId: mockCurrentUser.id };
            mockPrismaService.course.findUnique.mockResolvedValue(null);
            mockPrismaService.course.create.mockResolvedValue(mockCourse);

            const result = await service.createCourse(dto as any, mockCurrentUser);

            expect(result).toEqual(mockCourse);
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
    });

    describe('createEnrollment', () => {
        it('should enroll user in course', async () => {
            const dto = { courseId: 'course-1' };
            const mockEnrollment = { id: 'enroll-1', ...dto, userId: mockCurrentUser.id };

            mockPrismaService.course.findUnique.mockResolvedValue({
                id: 'course-1',
                status: 'APPROVED',
            });
            mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
            mockPrismaService.enrollment.create.mockResolvedValue(mockEnrollment);
            mockPrismaService.enrollment.count.mockResolvedValue(1);
            mockPrismaService.course.update.mockResolvedValue({});

            const result = await service.createEnrollment(dto as any, mockCurrentUser);

            expect(result).toEqual(mockEnrollment);
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
