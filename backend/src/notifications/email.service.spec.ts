import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';

const mockSend = jest.fn();
const mockSetApiKey = jest.fn();
jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: (...args: unknown[]) => mockSetApiKey(...args),
    send: (...args: unknown[]) => mockSend(...args),
  },
}));
jest.mock('../prisma/prisma.service');
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  Logger: Object.assign(jest.fn(), { overrideLogger: jest.fn() }),
}));

describe('EmailService', () => {
  let service: EmailService;
  let prisma: PrismaService;
  let configService: ConfigService;
  let logger: any;

  const mockSendGridApiKey = 'test-sendgrid-key';
  const mockFromEmail = 'noreply@ilease.ng';

  beforeEach(async () => {
    mockSend.mockReset();
    mockSetApiKey.mockReset();
    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    (Logger as unknown as jest.Mock).mockReturnValue(logger);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useClass: jest.fn(() => ({
            user: {
              findUnique: jest.fn(),
            },
          })),
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    (configService.get as jest.Mock)
      .mockImplementation((key: string) => {
        if (key === 'SENDGRID_API_KEY') return mockSendGridApiKey;
        if (key === 'EMAIL_FROM') return mockFromEmail;
        return null;
      });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should configure SendGrid when API key is provided', () => {
      expect(configService.get).toHaveBeenCalledWith('SENDGRID_API_KEY');
      expect(configService.get).toHaveBeenCalledWith('EMAIL_FROM');
      expect(logger.log).toHaveBeenCalledWith(expect.stringMatching(/SendGrid email service configured|RootTestModule/));
    });

    it('should log warning when SendGrid is not configured', () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'SENDGRID_API_KEY') return null;
        if (key === 'EMAIL_FROM') return mockFromEmail;
        return null;
      });

      const newService = new EmailService(prisma, configService);
      expect(logger.warn).toHaveBeenCalledWith('SendGrid not configured. Email notifications will be logged only.');
    });
  });

  describe('sendNotificationEmail', () => {
    const mockUserId = 'user-123';
    const mockNotification = {
      id: 'notif-123',
      type: 'APPOINTMENT',
      title: 'Appointment Update',
      message: 'Your appointment has been confirmed',
    };

    const mockUser = {
      id: mockUserId,
      email: 'user@example.com',
      name: 'Test User',
      yorubaName: 'Test Yoruba Name',
    };

    beforeEach(() => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should send email notification when SendGrid is configured', async () => {
      mockSend.mockResolvedValueOnce({});
      (service as any).isConfigured = true;

      await service.sendNotificationEmail(mockUserId, mockNotification);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { email: true, name: true, yorubaName: true },
      });
      expect(mockSend).toHaveBeenCalledWith({
        to: mockUser.email,
        from: mockFromEmail,
        subject: 'Appointment Update - Ilé Àṣẹ',
        html: expect.any(String),
      });
      expect(logger.log).toHaveBeenCalledWith(`Email sent to ${mockUser.email} for notification ${mockNotification.id}`);
    });

    it('should log email instead of sending when SendGrid is not configured', async () => {
      // Temporarily disable SendGrid
      const originalIsConfigured = (service as any).isConfigured;
      (service as any).isConfigured = false;

      await service.sendNotificationEmail(mockUserId, mockNotification);

      expect(logger.log).toHaveBeenCalledWith(`[EMAIL] To: ${mockUser.email}`);
      expect(logger.log).toHaveBeenCalledWith(`[EMAIL] Subject: Appointment Update - Ilé Àṣẹ`);
      expect(logger.log).toHaveBeenCalledWith(expect.stringMatching(/\[EMAIL\] Body:/));

      // Restore
      (service as any).isConfigured = originalIsConfigured;
    });

    it('should throw error when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.sendNotificationEmail(mockUserId, mockNotification)).rejects.toThrow('User not found');
    });

    it('should handle email sending errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('SendGrid error'));
      (service as any).isConfigured = true;

      await expect(service.sendNotificationEmail(mockUserId, mockNotification)).rejects.toThrow('SendGrid error');
      expect(logger.error).toHaveBeenCalledWith('Failed to send email: SendGrid error');
    });
  });

  describe('sendPasswordResetEmail', () => {
    const mockEmail = 'user@example.com';
    const mockResetToken = 'reset-token-123';
    const mockUserName = 'Test User';
    const mockFrontendUrl = 'http://localhost:5173';

    beforeEach(() => {
      (configService.get as jest.Mock)
        .mockImplementation((key: string) => {
          if (key === 'SENDGRID_API_KEY') return mockSendGridApiKey;
          if (key === 'EMAIL_FROM') return mockFromEmail;
          if (key === 'FRONTEND_URL') return mockFrontendUrl;
          return null;
        });
    });

    it('should send password reset email when SendGrid is configured', async () => {
      mockSend.mockResolvedValueOnce({});
      (service as any).isConfigured = true;

      await service.sendPasswordResetEmail(mockEmail, mockResetToken, mockUserName);

      expect(mockSend).toHaveBeenCalledWith({
        to: mockEmail,
        from: mockFromEmail,
        subject: 'Password Reset Request - Ilé Àṣẹ',
        html: expect.any(String),
      });
      expect(logger.log).toHaveBeenCalledWith(`Password reset email sent to ${mockEmail}`);
    });

    it('should log password reset email instead of sending when SendGrid is not configured', async () => {
      // Temporarily disable SendGrid
      const originalIsConfigured = (service as any).isConfigured;
      (service as any).isConfigured = false;

      await service.sendPasswordResetEmail(mockEmail, mockResetToken, mockUserName);

      expect(logger.log).toHaveBeenCalledWith(`[EMAIL] Password Reset To: ${mockEmail}`);
      expect(logger.log).toHaveBeenCalledWith(`[EMAIL] Reset URL: ${mockFrontendUrl}/reset-password?token=${mockResetToken}`);
      expect(logger.log).toHaveBeenCalledWith(`[EMAIL] Reset Token: ${mockResetToken}`);

      // Restore
      (service as any).isConfigured = originalIsConfigured;
    });

    it('should handle password reset email sending errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('SendGrid error'));
      (service as any).isConfigured = true;

      await expect(service.sendPasswordResetEmail(mockEmail, mockResetToken, mockUserName)).rejects.toThrow('SendGrid error');
      expect(logger.error).toHaveBeenCalledWith('Failed to send password reset email: SendGrid error');
    });
  });
});