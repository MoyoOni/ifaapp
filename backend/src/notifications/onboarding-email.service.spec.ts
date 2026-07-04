import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingEmailService } from './onboarding-email.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

describe('OnboardingEmailService', () => {
  let service: OnboardingEmailService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingEmailService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            onboardingEmail: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendDirectEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingEmailService>(OnboardingEmailService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOnboardingCompletionEmail', () => {
    const userId = 'test-user-id';
    const user = {
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'CLIENT',
      yorubaName: 'Test Yoruba Name',
    };

    it('should send an onboarding completion email to the user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user as any);
      jest.spyOn(emailService, 'sendDirectEmail').mockResolvedValue();
      jest.spyOn(prismaService.onboardingEmail, 'create').mockResolvedValue({
        id: 'email-record-id',
        userId,
        email: user.email,
        sentAt: new Date(),
      } as any);

      await service.sendOnboardingCompletionEmail(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          yorubaName: true,
        },
      });

      expect(emailService.sendDirectEmail).toHaveBeenCalledWith(
        user.email,
        expect.any(String),
        expect.any(String)
      );
      expect(prismaService.onboardingEmail.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          email: user.email,
          sentAt: expect.any(Date),
        },
      });
    });

    it('should do nothing when the user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.sendOnboardingCompletionEmail('non-existent-user-id')
      ).resolves.not.toThrow();
      expect(emailService.sendDirectEmail).not.toHaveBeenCalled();
    });

    it('should propagate an error when sending email fails', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user as any);
      jest.spyOn(emailService, 'sendDirectEmail').mockRejectedValue(new Error('Mail failed'));

      await expect(service.sendOnboardingCompletionEmail(userId)).rejects.toThrow('Mail failed');
    });

    // The email send and the onboardingEmail audit-record write share one try/catch
    // in the real service, so a record-creation failure surfaces as a thrown error
    // too (even though the email itself already went out) — this pins that actual
    // behavior rather than the previous version of this test, which asserted the
    // opposite of what the code does.
    it('propagates an error when the onboarding email record write fails, even though the email already sent', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user as any);
      jest.spyOn(emailService, 'sendDirectEmail').mockResolvedValue();
      jest.spyOn(prismaService.onboardingEmail, 'create').mockRejectedValue(new Error('DB error'));

      await expect(service.sendOnboardingCompletionEmail(userId)).rejects.toThrow('DB error');
      expect(emailService.sendDirectEmail).toHaveBeenCalled();
    });
  });
});
