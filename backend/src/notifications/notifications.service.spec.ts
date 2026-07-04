import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, Notification } from '@prisma/client';
import { NotificationType } from '@common/enums/notification-type.enum';
import { NotificationStatus } from '@common/enums/notification-status.enum';
import { UserRole } from '@common/enums/user-role.enum';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<NotificationsService>(NotificationsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockUser: User = {
        id: 'user1',
        email: 'user@example.com',
        firstName: 'Test',
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

      const newNotification: Notification = {
        id: 'notif1',
        userId: 'user1',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.GENERAL,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        data: {},
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.notification, 'create').mockResolvedValue(newNotification);

      const result = await service.createNotification({
        userId: 'user1',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.GENERAL,
      });

      expect(result).toEqual(newNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          title: 'Test Notification',
          message: 'This is a test notification',
          type: NotificationType.GENERAL,
          status: NotificationStatus.UNREAD,
        },
      });
    });

    it('should throw an exception if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createNotification({
          userId: 'nonexistent-user',
          title: 'Test Notification',
          message: 'This is a test notification',
          type: NotificationType.GENERAL,
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if notification type is invalid', async () => {
      const mockUser: User = {
        id: 'user1',
        email: 'user@example.com',
        firstName: 'Test',
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

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.createNotification({
          userId: 'user1',
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'INVALID_TYPE' as any,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve user notifications successfully', async () => {
      const mockNotifications: Notification[] = [
        {
          id: 'notif1',
          userId: 'user1',
          title: 'First Notification',
          message: 'This is the first notification',
          type: NotificationType.GENERAL,
          status: NotificationStatus.UNREAD,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          updatedAt: new Date(Date.now() - 86400000),
          readAt: null,
          data: {},
        },
        {
          id: 'notif2',
          userId: 'user1',
          title: 'Second Notification',
          message: 'This is the second notification',
          type: NotificationType.SYSTEM,
          status: NotificationStatus.READ,
          createdAt: new Date(),
          updatedAt: new Date(),
          readAt: new Date(),
          data: {},
        },
      ];

      jest.spyOn(prisma.notification, 'findMany').mockResolvedValue(mockNotifications);

      const result = await service.getUserNotifications('user1');

      expect(result).toEqual(mockNotifications);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no notifications exist', async () => {
      jest.spyOn(prisma.notification, 'findMany').mockResolvedValue([]);

      const result = await service.getUserNotifications('user1');

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read successfully', async () => {
      const mockNotification: Notification = {
        id: 'notif1',
        userId: 'user1',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.GENERAL,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        data: {},
      };

      const updatedNotification = {
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: new Date(),
      };

      jest.spyOn(prisma.notification, 'findUnique').mockResolvedValue(mockNotification);
      jest.spyOn(prisma.notification, 'update').mockResolvedValue(updatedNotification);

      const result = await service.markAsRead('notif1', 'user1');

      expect(result).toEqual(updatedNotification);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: {
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException if user does not own the notification', async () => {
      const mockNotification: Notification = {
        id: 'notif1',
        userId: 'different-user', // Different user owns this notification
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.GENERAL,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        data: {},
      };

      jest.spyOn(prisma.notification, 'findUnique').mockResolvedValue(mockNotification);

      await expect(service.markAsRead('notif1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      jest.spyOn(prisma.notification, 'findUnique').mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent-notif', 'user1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read successfully', async () => {
      const mockUser: User = {
        id: 'user1',
        email: 'user@example.com',
        firstName: 'Test',
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

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.notification, 'updateMany').mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead('user1');

      expect(result.count).toBe(3);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          status: NotificationStatus.UNREAD,
        },
        data: {
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.markAllAsRead('nonexistent-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification successfully', async () => {
      const mockNotification: Notification = {
        id: 'notif1',
        userId: 'user1',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.GENERAL,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        data: {},
      };

      jest.spyOn(prisma.notification, 'findUnique').mockResolvedValue(mockNotification);
      jest.spyOn(prisma.notification, 'delete').mockResolvedValue(mockNotification);

      const result = await service.deleteNotification('notif1', 'user1');

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif1' },
      });
    });

    it('should throw ForbiddenException if user does not own the notification', async () => {
      const mockNotification: Notification = {
        id: 'notif1',
        userId: 'different-user', // Different user owns this notification
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.GENERAL,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        data: {},
      };

      jest.spyOn(prisma.notification, 'findUnique').mockResolvedValue(mockNotification);

      await expect(service.deleteNotification('notif1', 'user1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      jest.spyOn(prisma.notification, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteNotification('nonexistent-notif', 'user1')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
