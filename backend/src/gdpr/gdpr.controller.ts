import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { GdprService } from './gdpr.service';
import { Response } from 'express';

interface ConsentPreferences {
  marketingEmails?: boolean;
  dataProcessing?: boolean;
  forumDigest?: boolean;
}

@Controller('gdpr')
@UseGuards(JwtAuthGuard)
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  /**
   * Exports user's personal data in compliance with GDPR Article 20 (right to data portability)
   * @param user The authenticated user requesting their data
   * @param response Express response object to send JSON file
   */
  @Get('data-export')
  async exportUserData(
    @CurrentUser() user: CurrentUserPayload,
    @Res() response: Response
  ) {
    try {
      const userData = await this.gdprService.exportUserData(user.id);
      
      // Send as downloadable JSON file
      response.setHeader('Content-Type', 'application/json');
      response.setHeader('Content-Disposition', `attachment; filename=user-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`);
      response.status(HttpStatus.OK).send(userData);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not export user data: ${(error as Error).message}`);
    }
  }

  /**
   * Allows user to delete their account and personal data in compliance with GDPR Article 17 (right to erasure)
   * @param user The authenticated user requesting deletion
   */
  @HttpCode(HttpStatus.OK)
  @Delete('delete-account')
  async deleteAccount(
    @CurrentUser() user: CurrentUserPayload
  ) {
    try {
      // Note: In a real implementation, we'd probably want to trigger this through a queue
      // and send confirmation email before actually deleting, but for this implementation:
      return await this.gdprService.deleteUser(user.id, user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not delete user account: ${(error as Error).message}`);
    }
  }

  /**
   * Updates user's consent preferences
   * @param user The authenticated user updating preferences
   * @param preferences The consent preferences to update
   */
  @Post('consent-preferences')
  async updateConsentPreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body() preferences: ConsentPreferences
  ) {
    try {
      return await this.gdprService.updateConsentPreferences(user.id, preferences);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not update consent preferences: ${(error as Error).message}`);
    }
  }
}