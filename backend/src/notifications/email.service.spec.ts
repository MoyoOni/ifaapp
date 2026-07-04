import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SesEmailService } from '../shared/services/ses-email.service';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let prisma: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;
  let sesEmailService: jest.Mocked<SesEmailService>;

  const mockUser = {
    email: 'user@example.com',
    name: 'Test User',
    yorubaName: 'Test Yoruba Name',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: SesEmailService,
          useValue: { sendEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    sesEmailService = module.get(SesEmailService) as jest.Mocked<SesEmailService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotificationEmail', () => {
    const mockUserId = 'user-123';
    const mockNotification = {
      id: 'notif-123',
      type: 'APPOINTMENT',
      title: 'Appointment Update',
      message: 'Your appointment has been confirmed',
    };

    it('should send email via SES when user is found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (sesEmailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      await service.sendNotificationEmail(mockUserId, mockNotification);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { email: true, name: true, yorubaName: true },
      });
      expect(sesEmailService.sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        'Appointment Update - Ilé Àṣẹ',
        expect.any(String)
      );
    });

    it('should warn and return when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await service.sendNotificationEmail(mockUserId, mockNotification);

      expect(sesEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should use yorubaName as display name when available', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (sesEmailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      await service.sendNotificationEmail(mockUserId, mockNotification);

      const htmlArg = (sesEmailService.sendEmail as jest.Mock).mock.calls[0][2] as string;
      expect(htmlArg).toContain(mockUser.yorubaName);
    });

    it('should handle unknown notification type with fallback subject', async () => {
      const unknownNotification = { ...mockNotification, type: 'UNKNOWN_TYPE' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (sesEmailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      await service.sendNotificationEmail(mockUserId, unknownNotification);

      expect(sesEmailService.sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        'Notification - Ilé Àṣẹ',
        expect.any(String)
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    const mockEmail = 'user@example.com';
    const mockResetToken = 'reset-token-123';
    const mockUserName = 'Test User';
    const mockFrontendUrl = 'http://localhost:5173';

    beforeEach(() => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'FRONTEND_URL') return mockFrontendUrl;
        return null;
      });
    });

    it('should send password reset email via SES', async () => {
      (sesEmailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      await service.sendPasswordResetEmail(mockEmail, mockResetToken, mockUserName);

      expect(sesEmailService.sendEmail).toHaveBeenCalledWith(
        mockEmail,
        'Password Reset Request - Ilé Àṣẹ',
        expect.any(String)
      );
    });

    it('should include reset URL in the email HTML', async () => {
      (sesEmailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      await service.sendPasswordResetEmail(mockEmail, mockResetToken, mockUserName);

      const htmlArg = (sesEmailService.sendEmail as jest.Mock).mock.calls[0][2] as string;
      expect(htmlArg).toContain(mockResetToken);
    });

    it('should use fallback frontend URL when FRONTEND_URL is not configured', async () => {
      (configService.get as jest.Mock).mockReturnValue(null);
      (sesEmailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      await service.sendPasswordResetEmail(mockEmail, mockResetToken, mockUserName);

      const htmlArg = (sesEmailService.sendEmail as jest.Mock).mock.calls[0][2] as string;
      expect(htmlArg).toContain('localhost:5173');
    });
  });
});
