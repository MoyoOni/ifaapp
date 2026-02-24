import { Test, TestingModule } from '@nestjs/testing';
import { BabalawoClientService } from './babalawo-client.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('BabalawoClientService', () => {
    let service: BabalawoClientService;
    let prisma: PrismaService;

    const mockPrismaService = {
        babalawoClient: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockCurrentUser = {
        id: 'babalawo-1',
        email: 'babalawo@example.com',
        role: 'BABALAWO' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BabalawoClientService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<BabalawoClientService>(BabalawoClientService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('assignClient', () => {
        it('should assign client to babalawo', async () => {
            const dto = { clientId: 'client-1' };
            const mockRelationship = {
                id: 'rel-1',
                babalawoId: mockCurrentUser.id,
                clientId: dto.clientId,
                status: 'ACTIVE',
            };

            mockPrismaService.babalawoClient.create.mockResolvedValue(mockRelationship);

            const result = await service.assignClient(mockCurrentUser.id, dto as any, mockCurrentUser);

            expect(result).toEqual(mockRelationship);
        });
    });

    describe('getClients', () => {
        it('should return babalawo clients', async () => {
            const mockClients = [
                { id: 'rel-1', clientId: 'client-1', status: 'ACTIVE' },
            ];

            mockPrismaService.babalawoClient.findMany.mockResolvedValue(mockClients);

            const result = await service.getClients(mockCurrentUser.id, mockCurrentUser);

            expect(result).toEqual(mockClients);
        });

        it('should throw ForbiddenException when accessing other babalawo clients', async () => {
            await expect(service.getClients('other-babalawo', mockCurrentUser)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getPersonalAwo', () => {
        it('should return client personal awo', async () => {
            const clientId = 'client-1';
            const currentUser = { ...mockCurrentUser, id: clientId, role: 'CLIENT' as any };

            const mockRelationship = {
                id: 'rel-1',
                babalawoId: 'bab-1',
                clientId,
                status: 'ACTIVE',
            };

            mockPrismaService.babalawoClient.findFirst.mockResolvedValue(mockRelationship);

            const result = await service.getPersonalAwo(clientId, currentUser);

            expect(result).toEqual(mockRelationship);
        });
    });
});
