import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService, NotificationType, NotificationCategory } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { PushNotificationService } from './push-notification.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('NotificationService', () => {
    let service: NotificationService;
    let prisma: PrismaService;
    let emailService: EmailService;

    const mockPrismaService = {
        notification: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
    };

    const mockEmailService = {
        sendNotificationEmail: jest.fn(),
    };

    // Mock PushNotificationService
    const mockPushNotificationService = {
        sendToUser: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: EmailService,
                    useValue: mockEmailService,
                },
                {
                    provide: PushNotificationService,
                    useValue: mockPushNotificationService,
                },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
        prisma = module.get<PrismaService>(PrismaService);
        emailService = module.get<EmailService>(EmailService);

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('notifyAppointmentDeclined', () => {
    it('should create appointment declined notification', async () => {
      const notificationData = {
        appointmentId: 'appt123',
      };

      await service.notifyAppointmentDeclined('appt123', 'user123', notificationData);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          type: NotificationType.APPOINTMENT,
          category: NotificationCategory.ERROR,
          title: 'Appointment Declined',
          message: 'Your appointment request has been declined.',
          data: { appointmentId: 'appt123' },
          emailSent: false,
          pushSent: false,
        },
      });
    });

    it('should send notification with reason when provided', async () => {
      const notificationData = {
        appointmentId: 'appt123',
        reason: 'Babalawo unavailable',
      };

      await service.notifyAppointmentDeclined('appt123', 'user123', notificationData);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          type: NotificationType.APPOINTMENT,
          category: NotificationCategory.ERROR,
          title: 'Appointment Declined',
          message: 'Your appointment request has been declined. Reason: Babalawo unavailable',
          data: { appointmentId: 'appt123', reason: 'Babalawo unavailable' },
          emailSent: false,
          pushSent: false,
        },
      });
    });
  });

  describe('notifyAppointmentCancelled', () => {
    it('should create appointment cancelled notification', async () => {
      const notificationData = {
        appointmentId: 'appt123',
        cancelledBy: 'babalawo',
      };

      await service.notifyAppointmentCancelled('appt123', 'user123', notificationData);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          type: NotificationType.APPOINTMENT,
          category: NotificationCategory.WARNING,
          title: 'Appointment Cancelled',
          message: 'Your appointment has been cancelled by babalawo.',
          data: { appointmentId: 'appt123', cancelledBy: 'babalawo' },
          emailSent: false,
          pushSent: false,
        },
      });
    });

    it('should send notification with reason when provided', async () => {
      const notificationData = {
        appointmentId: 'appt123',
        cancelledBy: 'client',
        reason: 'Emergency',
      };

      await service.notifyAppointmentCancelled('appt123', 'user123', notificationData);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          type: NotificationType.APPOINTMENT,
          category: NotificationCategory.WARNING,
          title: 'Appointment Cancelled',
          message: 'Your appointment has been cancelled by client. Reason: Emergency',
          data: { appointmentId: 'appt123', cancelledBy: 'client', reason: 'Emergency' },
          emailSent: false,
          pushSent: false,
        },
      });
    });
  });

  describe('createNotification', () => {
        it('should create a notification without email', async () => {
            const dto = {
                userId: 'user-1',
                type: NotificationType.APPOINTMENT,
                category: NotificationCategory.INFO,
                title: 'Booking Confirmed',
                message: 'Your booking has been confirmed',
                sendEmail: false,
                sendPush: false,
            };

            const mockNotification = {
                id: 'notif-1',
                ...dto,
                data: {}, // Changed from null to {}
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            const result = await service.createNotification(dto);

            expect(result).toEqual(mockNotification);
            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: dto.userId,
                    type: dto.type,
                    category: dto.category,
                    title: dto.title,
                    message: dto.message,
                    data: {}, // Changed from null to {}
                    emailSent: false,
                    pushSent: false,
                },
            });
            expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
        });

        it('should create a notification and send email when sendEmail is true', async () => {
            const dto = {
                userId: 'user-1',
                type: NotificationType.APPOINTMENT,
                category: NotificationCategory.SUCCESS,
                title: 'Booking Confirmed',
                message: 'Your booking has been confirmed',
                sendEmail: true,
                sendPush: false,
            };

            const mockNotification = {
                id: 'notif-2',
                ...dto,
                data: null,
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            mockEmailService.sendNotificationEmail.mockResolvedValue(undefined);

            const result = await service.createNotification(dto);

            expect(result).toEqual(mockNotification);
            expect(emailService.sendNotificationEmail).toHaveBeenCalledWith(
                dto.userId,
                mockNotification,
            );
        });

        it('should create a notification with custom data', async () => {
            const dto = {
                userId: 'user-1',
                type: NotificationType.ORDER,
                category: NotificationCategory.INFO,
                title: 'Order Update',
                message: 'Your order has been shipped',
                data: { orderId: 'order-123', trackingNumber: 'TRACK123' },
                sendEmail: false,
                sendPush: false,
            };

            const mockNotification = {
                id: 'notif-3',
                ...dto,
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            const result = await service.createNotification(dto);

            expect(result).toEqual(mockNotification);
            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    data: dto.data,
                }),
            });
        });

        it('should handle email sending errors gracefully', async () => {
            const dto = {
                userId: 'user-1',
                type: NotificationType.SYSTEM,
                category: NotificationCategory.ERROR,
                title: 'System Alert',
                message: 'An error occurred',
                sendEmail: true,
                sendPush: false,
            };

            const mockNotification = {
                id: 'notif-4',
                ...dto,
                data: null,
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            mockEmailService.sendNotificationEmail.mockRejectedValue(
                new Error('Email service unavailable'),
            );

            // Should still return notification even if email fails
            const result = await service.createNotification(dto);

            expect(result).toEqual(mockNotification);
            expect(emailService.sendNotificationEmail).toHaveBeenCalled();
        });
    });

    describe('getUserNotifications', () => {
        it('should return all notifications for a user', async () => {
            const userId = 'user-1';
            const mockNotifications = [
                {
                    id: 'notif-1',
                    userId,
                    type: NotificationType.APPOINTMENT,
                    category: NotificationCategory.INFO,
                    title: 'Test 1',
                    message: 'Message 1',
                    read: false,
                    createdAt: new Date(),
                },
                {
                    id: 'notif-2',
                    userId,
                    type: NotificationType.MESSAGE,
                    category: NotificationCategory.INFO,
                    title: 'Test 2',
                    message: 'Message 2',
                    read: true,
                    createdAt: new Date(),
                },
            ];

            mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);

            const result = await service.getUserNotifications(userId);

            expect(result).toEqual(mockNotifications);
            expect(prisma.notification.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50, // Added the take parameter
            });
        });

        it('should return only unread notifications when unreadOnly is true', async () => {
            const userId = 'user-1';
            const mockUnreadNotifications = [
                {
                    id: 'notif-1',
                    userId,
                    type: NotificationType.APPOINTMENT,
                    category: NotificationCategory.INFO,
                    title: 'Unread 1',
                    message: 'Message 1',
                    read: false,
                    createdAt: new Date(),
                },
            ];

            mockPrismaService.notification.findMany.mockResolvedValue(mockUnreadNotifications);

            const result = await service.getUserNotifications(userId, true);

            expect(result).toEqual(mockUnreadNotifications);
            expect(prisma.notification.findMany).toHaveBeenCalledWith({
                where: { userId, read: false },
                orderBy: { createdAt: 'desc' },
                take: 50, // Added the take parameter
            });
        });

        it('should return empty array when user has no notifications', async () => {
            const userId = 'user-no-notifs';

            mockPrismaService.notification.findMany.mockResolvedValue([]);

            const result = await service.getUserNotifications(userId);

            expect(result).toEqual([]);
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            const notificationId = 'notif-1';
            const userId = 'user-1';

            const mockNotification = {
                id: notificationId,
                userId,
                type: NotificationType.APPOINTMENT,
                category: NotificationCategory.INFO,
                title: 'Test',
                message: 'Test message',
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockUpdatedNotification = {
                ...mockNotification,
                read: true,
                updatedAt: new Date(),
                readAt: new Date(), // Add the readAt property
            };

            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
            mockPrismaService.notification.update.mockResolvedValue(mockUpdatedNotification);

            const result = await service.markAsRead(notificationId, userId);

            expect(result).toEqual(mockUpdatedNotification);
            expect(prisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId },
            });
            expect(prisma.notification.update).toHaveBeenCalledWith({
                where: { id: notificationId },
                data: { read: true, readAt: expect.any(Date) }, // Updated expectation to include readAt
            });
        });

        it('should throw NotFoundException when notification does not exist', async () => {
            const notificationId = 'nonexistent';
            const userId = 'user-1';

            mockPrismaService.notification.findUnique.mockResolvedValue(null);

            await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException when user does not own notification', async () => {
            const notificationId = 'notif-1';
            const userId = 'user-1';
            const otherUserId = 'user-2';

            const mockNotification = {
                id: notificationId,
                userId: otherUserId, // Different user
                type: NotificationType.APPOINTMENT,
                category: NotificationCategory.INFO,
                title: 'Test',
                message: 'Test message',
                read: false,
                createdAt: new Date(),
            };

            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);

            await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read for a user', async () => {
            const userId = 'user-1';

            mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

            await service.markAllAsRead(userId);

            expect(prisma.notification.updateMany).toHaveBeenCalledWith({
                where: { userId, read: false },
                data: { read: true, readAt: expect.any(Date) }, // Updated expectation to include readAt
            });
        });

        it('should handle case when user has no unread notifications', async () => {
            const userId = 'user-no-unread';

            mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

            await service.markAllAsRead(userId);

            expect(prisma.notification.updateMany).toHaveBeenCalled();
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread notification count', async () => {
            const userId = 'user-1';

            mockPrismaService.notification.count.mockResolvedValue(3);

            const result = await service.getUnreadCount(userId);

            expect(result).toBe(3);
            expect(prisma.notification.count).toHaveBeenCalledWith({
                where: { userId, read: false },
            });
        });

        it('should return 0 when user has no unread notifications', async () => {
            const userId = 'user-no-unread';

            mockPrismaService.notification.count.mockResolvedValue(0);

            const result = await service.getUnreadCount(userId);

            expect(result).toBe(0);
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification', async () => {
            const notificationId = 'notif-1';
            const userId = 'user-1';

            const mockNotification = {
                id: notificationId,
                userId,
                type: NotificationType.APPOINTMENT,
                category: NotificationCategory.INFO,
                title: 'Test',
                message: 'Test message',
                read: false,
                createdAt: new Date(),
            };

            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
            mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

            await service.deleteNotification(notificationId, userId);

            expect(prisma.notification.delete).toHaveBeenCalledWith({
                where: { id: notificationId },
            });
        });

        it('should throw NotFoundException when notification does not exist', async () => {
            const notificationId = 'nonexistent';
            const userId = 'user-1';

            mockPrismaService.notification.findUnique.mockResolvedValue(null);

            await expect(service.deleteNotification(notificationId, userId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException when user does not own notification', async () => {
            const notificationId = 'notif-1';
            const userId = 'user-1';

            const mockNotification = {
                id: notificationId,
                userId: 'user-2', // Different user
                type: NotificationType.APPOINTMENT,
                category: NotificationCategory.INFO,
                title: 'Test',
                message: 'Test message',
                read: false,
                createdAt: new Date(),
            };

            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);

            await expect(service.deleteNotification(notificationId, userId)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('notifyAppointmentCreated', () => {
        it('should create appointment notification', async () => {
            const appointmentId = 'appt-1';
            const userId = 'user-1';
            const appointmentData = {
                date: '2024-03-15',
                time: '10:00 AM',
                babalawoName: 'Baba Ifa',
            };

            const mockNotification = {
                id: 'notif-1',
                userId,
                type: NotificationType.APPOINTMENT,
                category: NotificationCategory.INFO,
                title: 'New Appointment Request',
                message: expect.any(String),
                data: { appointmentId, ...appointmentData },
                read: false,
                createdAt: new Date(),
            };

            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            await service.notifyAppointmentCreated(appointmentId, userId, appointmentData);

            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId,
                    type: NotificationType.APPOINTMENT,
                    data: expect.objectContaining({ appointmentId }),
                }),
            });
        });
    });

});
