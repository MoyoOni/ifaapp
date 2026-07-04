import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service'; // Using the existing EmailService

@Injectable()
export class OnboardingEmailService {
  private readonly logger = new Logger(OnboardingEmailService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService // Renamed to reflect actual service
  ) {}

  /**
   * Send onboarding completion email to a user
   */
  async sendOnboardingCompletionEmail(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          yorubaName: true,
        },
      });

      if (!user) {
        this.logger.warn(`User with ID ${userId} not found`);
        return;
      }

      const subject = 'Welcome to Ìlú Àṣẹ - Your Spiritual Journey Begins!';

      // Prepare personalized content based on user role
      const roleSpecificContent = this.getRoleSpecificContent(user.role);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to Ìlú Àṣẹ</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #DAA520;">Ìlú Àṣẹ</h1>
                <p style="font-size: 1.2em; color: #666;">Digital Heritage Sanctuary for Ifá Spiritual Community</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #f9f3ef 0%, #fefefe 100%); padding: 30px; border-radius: 10px; border-left: 5px solid #DAA520;">
                <h2 style="color: #2c3e50;">Congratulations, ${user.yorubaName || user.name}!</h2>
                
                <p>Your spiritual journey on Ìlú Àṣẹ has officially begun. You have successfully completed your onboarding and joined a community dedicated to preserving and sharing Yoruba Ifá traditions.</p>
                
                <div style="margin: 25px 0; padding: 15px; background-color: #fff8e1; border-left: 3px solid #ffc107; border-radius: 0 4px 4px 0;">
                  <p style="margin: 0; font-weight: bold; color: #e65100;">As a ${this.getRoleLabel(user.role)}, you can now:</p>
                  <ul style="margin: 10px 0 0 20px;">
                    ${roleSpecificContent}
                  </ul>
                </div>
                
                <p>We encourage you to explore the platform and connect with others who share your spiritual path. Remember, here we honor the ancestors, learn the old ways, and build the future together in a living community.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://iluase.com'}/dashboard" 
                     style="display: inline-block; background-color: #DAA520; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold;">
                    Visit Your Dashboard
                  </a>
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <p>Walk with purpose,</p>
                <p><em>The Ìlú Àṣẹ Stewards</em></p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 0.9em; color: #777;">
                <p>© ${new Date().getFullYear()} Ìlú Àṣẹ. All rights reserved.</p>
                <p>This email was sent to ${user.email} because you registered on Ìlú Àṣẹ.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Using the sendDirectEmail method of EmailService
      await this.emailService.sendDirectEmail(user.email, subject, htmlContent);

      this.logger.log(`Onboarding completion email sent to user ${userId}`);

      // Record the email sending in the database
      await this.prisma.onboardingEmail.create({
        data: {
          userId: user.id,
          email: user.email,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send onboarding completion email to user ${userId}:`, error);
      throw error;
    }
  }

  private getRoleLabel(role: string): string {
    switch (role) {
      case 'CLIENT':
        return 'Seeker';
      case 'BABALAWO':
        return 'Babalawo';
      case 'VENDOR':
        return 'Vendor';
      case 'ADMIN':
        return 'Administrator';
      default:
        return 'Member';
    }
  }

  private getRoleSpecificContent(role: string): string {
    switch (role) {
      case 'CLIENT':
        return `
          <li>Discover and book consultations with trusted practitioners</li>
          <li>Join community circles and discussions</li>
          <li>Access learning resources in the Academy</li>
          <li>Find and connect with spiritual homes (temples)</li>
        `;
      case 'BABALAWO':
        return `
          <li>Manage your practice and appointments</li>
          <li>Connect with seekers seeking your guidance</li>
          <li>Create and manage guidance plans</li>
          <li>Build your reputation through reviews</li>
        `;
      case 'VENDOR':
        return `
          <li>Set up and manage your sacred items shop</li>
          <li>List authentic spiritual supplies</li>
          <li>Connect with community members</li>
          <li>Grow your spiritual commerce</li>
        `;
      case 'ADMIN':
        return `
          <li>Moderate community content</li>
          <li>Verify practitioners and vendors</li>
          <li>Monitor platform health</li>
          <li>Ensure community guidelines are followed</li>
        `;
      default:
        return `
          <li>Explore the platform features</li>
          <li>Engage with community content</li>
          <li>Customize your profile</li>
          <li>Connect with other members</li>
        `;
    }
  }
}
