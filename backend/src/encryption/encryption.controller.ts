import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';
import { EncryptionKeyService } from './encryption-key.service';

@ApiTags('security')
@Controller('encryption')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EncryptionController {
  constructor(private readonly encryptionService: EncryptionKeyService) {}

  @Get('health')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get encryption key health status' })
  @ApiResponse({
    status: 200,
    description: 'Encryption key health report',
    schema: {
      type: 'object',
      properties: {
        isInitialized: { type: 'boolean' },
        isValid: { type: 'boolean' },
        isProductionReady: { type: 'boolean' },
        errors: {
          type: 'array',
          items: { type: 'string' },
        },
        environment: { type: 'string' },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getEncryptionHealth() {
    return this.encryptionService.getKeyHealth();
  }

  @Get('generate-key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate a secure encryption key' })
  @ApiResponse({
    status: 200,
    description: 'Generated encryption key',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        length: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async generateSecureKey() {
    const key = EncryptionKeyService.generateSecureKey();
    return {
      key,
      length: key.length,
      message: 'Store this key securely in your ENCRYPTION_KEY environment variable',
    };
  }

  @Get('validate-key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Validate an encryption key' })
  @ApiResponse({
    status: 200,
    description: 'Key validation result',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async validateKey() {
    const key = process.env.ENCRYPTION_KEY || '';
    const validation = EncryptionKeyService.validateKey(key);
    return validation;
  }
}
