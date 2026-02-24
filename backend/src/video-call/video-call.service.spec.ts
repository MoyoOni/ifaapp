import { Test, TestingModule } from '@nestjs/testing';
import { VideoCallService } from './video-call.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('VideoCallService', () => {
    let service: VideoCallService;
    let prisma: PrismaService;

    const mockPrismaService = {
        appointment: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'AGORA_APP_ID') return 'test-app-id';
            if (key === 'AGORA_APP_CERTIFICATE') return 'test-certificate';
            return null;
        }),
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CLIENT' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VideoCallService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<VideoCallService>(VideoCallService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('should generate video call token', async () => {
            const mockAppointment = {
                id: 'apt-1',
                babalawoId: 'bab-1',
                clientId: mockCurrentUser.id,
                status: 'UPCOMING',
                videoRoomId: null,
            };

            mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
            mockPrismaService.appointment.update.mockResolvedValue({ ...mockAppointment, videoRoomId: 'room-1' });

            const result = await service.generateToken('apt-1', mockCurrentUser.id, mockCurrentUser);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('roomId');
            expect(result).toHaveProperty('appId');
        });

        it('should throw NotFoundException when appointment not found', async () => {
            mockPrismaService.appointment.findUnique.mockResolvedValue(null);

            await expect(service.generateToken('nonexistent', 'user-1', mockCurrentUser)).rejects.toThrow(NotFoundException);
        });
    });

    describe('endSession', () => {
        it('should end video session', async () => {
            const mockAppointment = {
                id: 'apt-1',
                babalawoId: 'bab-1',
                clientId: mockCurrentUser.id,
                status: 'IN_SESSION',
            };

            mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
            mockPrismaService.appointment.update.mockResolvedValue({ ...mockAppointment, status: 'COMPLETED' });

            const result = await service.endSession('apt-1', mockCurrentUser);

            expect(result).toEqual({ success: true, message: 'Session ended successfully' });
        });
    });

    describe('getVideoCallInfo', () => {
        it('should return video call info', async () => {
            const mockAppointment = {
                id: 'apt-1',
                babalawoId: 'bab-1',
                clientId: mockCurrentUser.id,
                videoRoomId: 'room-1',
                status: 'UPCOMING',
                babalawo: { id: 'bab-1', name: 'Babalawo' },
                client: { id: mockCurrentUser.id, name: 'Client' },
            };

            mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

            const result = await service.getVideoCallInfo('apt-1', mockCurrentUser);

            expect(result).toHaveProperty('appointmentId');
            expect(result).toHaveProperty('canJoin');
        });
    });
});
