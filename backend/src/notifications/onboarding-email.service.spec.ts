import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingEmailService } from './onboarding-email.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

describe('OnboardingEmailService', () => {
  let service: OnboardingEmailService;
  let usersService: UsersService;
  let prismaService: PrismaService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingEmailService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
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
          provide: MailService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingEmailService>(OnboardingEmailService);
    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOnboardingCompletionEmail', () => {
    it('should send an onboarding completion email to the user', async () => {
      const userId = 'test-user-id';
      const user = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'CLIENT',
        yorubaName: 'Test Yoruba Name',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(mailService, 'sendMail').mockResolvedValue();
      jest.spyOn(prismaService.onboardingEmail, 'create').mockResolvedValue({
        id: 'email-record-id',
        userId,
        email: user.email,
        sentAt: new Date(),
      });

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

      expect(mailService.sendMail).toHaveBeenCalled();
      expect(prismaService.onboardingEmail.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          email: user.email,
          sentAt: expect.any(Date),
        },
      });
    });

    it('should handle case when user does not exist', async () => {
      const userId = 'non-existent-user-id';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.sendOnboardingCompletionEmail(userId)).resolves.not.toThrow();
    });

    it('should throw an error when sending email fails', async () => {
      const userId = 'test-user-id';
      const user = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'CLIENT',
        yorubaName: 'Test Yoruba Name',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(mailService, 'sendMail').mockRejectedValue(new Error('Mail failed'));

      await expect(service.sendOnboardingCompletionEmail(userId)).rejects.toThrow('Mail failed');
    });

    it('should continue when onboarding email record creation fails', async () => {
      const userId = 'test-user-id';
      const user = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'CLIENT',
        yorubaName: 'Test Yoruba Name',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(mailService, 'sendMail').mockResolvedValue();
      jest.spyOn(prismaService.onboardingEmail, 'create').mockRejectedValue(new Error('DB error'));

      await expect(service.sendOnboardingCompletionEmail(userId)).resolves.not.toThrow();
    });
  });
});