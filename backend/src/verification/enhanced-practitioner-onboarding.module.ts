import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EnhancedPractitionerOnboardingService } from './enhanced-practitioner-onboarding.service';
import { EnhancedPractitionerOnboardingController } from './enhanced-practitioner-onboarding.controller';
import { VerificationModule } from './verification.module'; // Import the base verification module

@Module({
  imports: [
    PrismaModule,
    VerificationModule, // Include base verification module for shared functionality
  ],
  providers: [EnhancedPractitionerOnboardingService],
  controllers: [EnhancedPractitionerOnboardingController],
  exports: [EnhancedPractitionerOnboardingService],
})
export class EnhancedPractitionerOnboardingModule {}