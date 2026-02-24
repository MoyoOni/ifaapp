import { Test, TestingModule } from '@nestjs/testing';
import { TutorsService } from './tutors.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TutorsService', () => {
    let service: TutorsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        tutor: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        tutorSession: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockCurrentUser = {
        id: 'tutor-1',
        email: 'tutor@example.com',
        role: 'BABALAWO' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TutorsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<TutorsService>(TutorsService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('createTutor', () => {
        it('should create tutor profile', async () => {
            const dto = {
                specialization: 'Divination',
                hourlyRate: 5000,
                availability: 'Weekdays',
            };

            const mockTutor = { id: 'tutor-1', userId: mockCurrentUser.id, ...dto };
            mockPrismaService.tutor.create.mockResolvedValue(mockTutor);

            const result = await service.createTutor(dto as any, mockCurrentUser);

            expect(result).toEqual(mockTutor);
        });
    });

    describe('findAllTutors', () => {
        it('should return all tutors', async () => {
            const mockTutors = [{ id: 'tutor-1', specialization: 'Divination' }];
            mockPrismaService.tutor.findMany.mockResolvedValue(mockTutors);

            const result = await service.findAllTutors();

            expect(result).toEqual(mockTutors);
        });
    });

    describe('createTutorSession', () => {
        it('should create tutoring session', async () => {
            const dto = {
                tutorId: 'tutor-1',
                date: '2024-06-01',
                time: '10:00',
                duration: 60,
            };

            mockPrismaService.tutor.findUnique.mockResolvedValue({
                id: 'tutor-1',
                status: 'APPROVED',
                hourlyRate: 6000,
            });
            mockPrismaService.tutorSession.findFirst.mockResolvedValue(null);

            const mockSession = { id: 'session-1', tutorId: dto.tutorId, studentId: mockCurrentUser.id, date: dto.date, time: dto.time, duration: 60 };
            mockPrismaService.tutorSession.create.mockResolvedValue(mockSession);

            const result = await service.createTutorSession(dto as any, mockCurrentUser);

            expect(result).toEqual(mockSession);
        });
    });
});
