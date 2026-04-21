import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../cache/cache-manager.service';
import { SearchService } from '../search/search.service';
import { OnboardingEmailService } from '../notifications/onboarding-email.service'; // Add this import
import { ProfileCompletenessService } from './profile-completeness.service'; // Add this import
import { ProfileCompletenessController } from './profile-completeness.controller'; // Add this import
import { ImageModule } from '../images/image.module'; // Add this import

@Module({
  imports: [ImageModule], // Add ImageModule to imports
  controllers: [UsersController, ProfileCompletenessController], // Add the new controller
  providers: [
    UsersService,
    PrismaService,
    CacheManagerService,
    SearchService,
    OnboardingEmailService, // Add this provider
    ProfileCompletenessService, // Add this provider
  ],
  exports: [UsersService, ProfileCompletenessService], // Export the new service
})
export class UsersModule {}