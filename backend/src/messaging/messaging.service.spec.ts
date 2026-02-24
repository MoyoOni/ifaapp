import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('MessagingService', () => {
    let service: MessagingService;
    let prisma: PrismaService;

    const mockPrismaService = {
        message: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            count: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        babalawoClient: {
            findFirst: jest.fn(),
        },
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CLIENT' as any,
        verified: true,
    };

    const mockOtherUser = {
        id: 'user-2',
        name: 'Other User',
        email: 'other@example.com',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagingService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<MessagingService>(MessagingService);
        prisma = module.get<PrismaService>(PrismaService);

        // Mock encryption key (must be exactly 32 chars for messaging service)
        process.env.ENCRYPTION_KEY = 'a'.repeat(32);

        jest.clearAllMocks();
    });

    describe('sendMessage', () => {
        it('should send a message successfully', async () => {
            const dto = {
                receiverId: 'user-2',
                content: 'Hello, how are you?',
            };

            const mockMessage = {
                id: 'message-1',
                senderId: mockCurrentUser.id,
                receiverId: dto.receiverId,
                content: dto.content,
                read: false,
                createdAt: new Date(),
            };

            mockPrismaService.babalawoClient.findFirst.mockResolvedValue({ id: 'rel-1' });
            mockPrismaService.message.create.mockResolvedValue(mockMessage);

            const result = await service.sendMessage(mockCurrentUser.id, dto as any, mockCurrentUser);

            expect(result).toEqual(mockMessage);
            expect(prisma.message.create).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when sender is not current user', async () => {
            const dto = {
                receiverId: 'user-2',
                content: 'Test',
            };

            await expect(
                service.sendMessage('other-user', dto as any, mockCurrentUser)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('sendSystemMessage', () => {
        it('should send system message without authorization checks', async () => {
            const mockMessage = {
                id: 'message-1',
                senderId: 'system',
                receiverId: 'user-1',
                content: 'Welcome to the platform!',
                read: false,
            };

            mockPrismaService.message.create.mockResolvedValue(mockMessage);

            const result = await service.sendSystemMessage('system', 'user-1', 'Welcome to the platform!');

            expect(result).toEqual(mockMessage);
        });
    });

    describe('getConversation', () => {
        it('should return conversation messages', async () => {
            const mockMessages = [
                { id: 'msg-1', senderId: 'user-1', receiverId: 'user-2', content: 'Hi', read: true },
                { id: 'msg-2', senderId: 'user-2', receiverId: 'user-1', content: 'Hello', read: true },
            ];

            mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

            const result = await service.getConversation('user-1', 'user-2', mockCurrentUser);

            expect(result).toEqual(mockMessages);
            expect(prisma.message.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.any(Array),
                    }),
                    orderBy: { createdAt: 'asc' },
                })
            );
        });

        it('should throw ForbiddenException when user is not participant', async () => {
            await expect(
                service.getConversation('user-3', 'user-4', mockCurrentUser)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getInbox', () => {
        it('should return user inbox with conversations', async () => {
            const mockMessages = [
                {
                    id: 'msg-1',
                    senderId: 'user-2',
                    receiverId: 'user-1',
                    content: 'Latest message',
                    createdAt: new Date(),
                    sender: mockOtherUser,
                },
            ];

            mockPrismaService.message.findMany.mockResolvedValue(mockMessages);
            mockPrismaService.message.count.mockResolvedValue(0);

            const result = await service.getInbox('user-1', mockCurrentUser);

            expect(result).toBeDefined();
            expect(prisma.message.findMany).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when accessing other user inbox', async () => {
            await expect(
                service.getInbox('user-2', mockCurrentUser)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('markAsRead', () => {
        it('should mark message as read', async () => {
            const mockMessage = {
                id: 'message-1',
                senderId: 'user-2',
                receiverId: 'user-1',
                content: 'Test',
                read: false,
            };

            const mockUpdatedMessage = {
                ...mockMessage,
                read: true,
            };

            mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
            mockPrismaService.message.update.mockResolvedValue(mockUpdatedMessage);

            const result = await service.markAsRead('message-1', 'user-1', mockCurrentUser);

            expect(result).toEqual(mockUpdatedMessage);
            expect(prisma.message.update).toHaveBeenCalledWith({
                where: { id: 'message-1' },
                data: expect.objectContaining({ read: true }),
            });
        });

        it('should throw NotFoundException when message not found', async () => {
            mockPrismaService.message.findUnique.mockResolvedValue(null);

            await expect(
                service.markAsRead('nonexistent', 'user-1', mockCurrentUser)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not receiver', async () => {
            const mockMessage = {
                id: 'message-1',
                receiverId: 'user-3',
            };

            mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);

            await expect(
                service.markAsRead('message-1', 'user-1', mockCurrentUser)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('markConversationAsRead', () => {
        it('should mark all messages in conversation as read', async () => {
            mockPrismaService.message.updateMany.mockResolvedValue({ count: 5 });

            const result = await service.markConversationAsRead('user-2', 'user-1', mockCurrentUser);

            expect(result).toMatchObject({ success: true });
            expect(prisma.message.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        senderId: 'user-2',
                        receiverId: 'user-1',
                    }),
                    data: expect.objectContaining({ read: true }),
                })
            );
        });

        it('should throw ForbiddenException when user is not participant', async () => {
            await expect(
                service.markConversationAsRead('user-3', 'user-2', mockCurrentUser)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('encryption', () => {
        it('should encrypt and decrypt content correctly', () => {
            const originalContent = 'This is a secret message';

            const encrypted = (service as any).encryptContent(originalContent);
            expect(encrypted).not.toBe(originalContent);

            const decrypted = (service as any).decryptContent(encrypted);
            expect(decrypted).toBe(originalContent);
        });
    });
});
