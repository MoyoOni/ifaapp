import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from './messaging.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, Message, Conversation } from '@prisma/client';
import { MessageStatus } from '@common/enums/message-status.enum';
import { UserRole } from '@common/enums/user-role.enum';

describe('MessagingService', () => {
  let service: MessagingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: PrismaService,
          useValue: {
            message: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            conversation: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<MessagingService>(MessagingService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const mockSender: User = {
        id: 'user1',
        email: 'sender@example.com',
        firstName: 'Sender',
        lastName: 'User',
        role: UserRole.CLIENT,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      const mockRecipient: User = {
        id: 'user2',
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
        role: UserRole.BABALAWO,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      const mockConversation: Conversation = {
        id: 'conv1',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        type: 'DIRECT',
      };

      const newMessage: Message = {
        id: 'msg1',
        content: 'Hello there!',
        senderId: 'user1',
        recipientId: 'user2',
        conversationId: 'conv1',
        status: MessageStatus.SENT,
        readAt: null,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'user1') return Promise.resolve(mockSender);
        if (where.id === 'user2') return Promise.resolve(mockRecipient);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.conversation, 'findUnique').mockResolvedValue(mockConversation);
      jest.spyOn(prisma.message, 'create').mockResolvedValue(newMessage);

      const result = await service.sendMessage(
        {
          recipientId: 'user2',
          content: 'Hello there!',
        },
        'user1'
      );

      expect(result).toEqual(newMessage);
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          content: 'Hello there!',
          senderId: 'user1',
          recipientId: 'user2',
          conversationId: 'conv1',
          status: MessageStatus.SENT,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isVerified: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
      });
    });

    it('should throw an exception if sender does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.sendMessage(
          {
            recipientId: 'user2',
            content: 'Hello there!',
          },
          'nonexistent-sender'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if recipient does not exist', async () => {
      const mockSender: User = {
        id: 'user1',
        email: 'sender@example.com',
        firstName: 'Sender',
        lastName: 'User',
        role: UserRole.CLIENT,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'user1') return Promise.resolve(mockSender);
        return Promise.resolve(null);
      });

      await expect(
        service.sendMessage(
          {
            recipientId: 'nonexistent-recipient',
            content: 'Hello there!',
          },
          'user1'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if content is empty', async () => {
      const mockSender: User = {
        id: 'user1',
        email: 'sender@example.com',
        firstName: 'Sender',
        lastName: 'User',
        role: UserRole.CLIENT,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      const mockRecipient: User = {
        id: 'user2',
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
        role: UserRole.BABALAWO,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'user1') return Promise.resolve(mockSender);
        if (where.id === 'user2') return Promise.resolve(mockRecipient);
        return Promise.resolve(null);
      });

      await expect(
        service.sendMessage(
          {
            recipientId: 'user2',
            content: '', // Empty content
          },
          'user1'
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMessages', () => {
    it('should retrieve messages between two users', async () => {
      const mockMessages: Message[] = [
        {
          id: 'msg1',
          content: 'First message',
          senderId: 'user1',
          recipientId: 'user2',
          conversationId: 'conv1',
          status: MessageStatus.READ,
          readAt: new Date(),
          deliveredAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'msg2',
          content: 'Second message',
          senderId: 'user2',
          recipientId: 'user1',
          conversationId: 'conv1',
          status: MessageStatus.DELIVERED,
          readAt: null,
          deliveredAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.message, 'findMany').mockResolvedValue(mockMessages);

      const result = await service.getMessages('user1', 'user2');

      expect(result).toEqual(mockMessages);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId: 'user1', recipientId: 'user2' },
            { senderId: 'user2', recipientId: 'user1' },
          ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isVerified: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
      });
    });

    it('should return empty array if no messages exist', async () => {
      jest.spyOn(prisma.message, 'findMany').mockResolvedValue([]);

      const result = await service.getMessages('user1', 'user2');

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should mark a message as read successfully', async () => {
      const mockMessage: Message = {
        id: 'msg1',
        content: 'Test message',
        senderId: 'user1',
        recipientId: 'user2',
        conversationId: 'conv1',
        status: MessageStatus.DELIVERED,
        readAt: null,
        deliveredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMessage = {
        ...mockMessage,
        status: MessageStatus.READ,
        readAt: new Date(),
      };

      jest.spyOn(prisma.message, 'findUnique').mockResolvedValue(mockMessage);
      jest.spyOn(prisma.message, 'update').mockResolvedValue(updatedMessage);

      const result = await service.markAsRead('msg1', 'user2');

      expect(result).toEqual(updatedMessage);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg1' },
        data: {
          status: MessageStatus.READ,
          readAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException if user is not the recipient', async () => {
      const mockMessage: Message = {
        id: 'msg1',
        content: 'Test message',
        senderId: 'user1',
        recipientId: 'user3', // Different recipient
        conversationId: 'conv1',
        status: MessageStatus.DELIVERED,
        readAt: null,
        deliveredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.message, 'findUnique').mockResolvedValue(mockMessage);

      await expect(service.markAsRead('msg1', 'user2')) // Trying to read as user2
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if message does not exist', async () => {
      jest.spyOn(prisma.message, 'findUnique').mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent-msg', 'user2')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getConversations', () => {
    it('should retrieve conversations for a user', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          participants: [
            {
              id: 'user1',
              firstName: 'User',
              lastName: 'One',
              avatar: 'avatar1.jpg',
              isVerified: true,
            },
            {
              id: 'user2',
              firstName: 'User',
              lastName: 'Two',
              avatar: 'avatar2.jpg',
              isVerified: false,
            },
          ],
          lastMessage: {
            id: 'msg1',
            content: 'Last message',
            createdAt: new Date(),
            status: MessageStatus.READ,
          },
        },
      ];

      // Mock the raw query that would return this data
      jest.spyOn<any, any>(service, 'getConversationsForUser').mockResolvedValue(mockConversations);

      const result = await service.getConversations('user1');

      expect(result).toEqual(mockConversations);
    });
  });
});
