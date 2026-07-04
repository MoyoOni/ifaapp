import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CacheModule } from '../cache/cache.module';
import { SearchService } from '../search/search.service';
import { OnboardingEmailService } from '../notifications/onboarding-email.service'; // Add this import
import { EmailService } from '../notifications/email.service';
import { ProfileCompletenessService } from './profile-completeness.service'; // Add this import
import { ProfileCompletenessController } from './profile-completeness.controller'; // Add this import
import { ImageModule } from '../images/image.module'; // Add this import

@Module({
  // CacheModule is imported (rather than providing CacheManagerService
  // directly) because CacheManagerService itself depends on
  // RedisCacheService — providing it standalone here left that dependency
  // unresolved, which only surfaced once the full AppModule graph compiled.
  imports: [ImageModule, CacheModule],
  controllers: [UsersController, ProfileCompletenessController], // Add the new controller
  providers: [
    UsersService,
    PrismaService,
    SearchService,
    // EmailService is a mandatory (non-optional) dependency of
    // OnboardingEmailService and was never provided anywhere in the app —
    // SesEmailService/ConfigService/PrismaService it needs are all globally
    // available, so providing it here is sufficient.
    EmailService,
    OnboardingEmailService, // Add this provider
    ProfileCompletenessService, // Add this provider
  ],
  exports: [UsersService, ProfileCompletenessService], // Export the new service
})
export class UsersModule {}
