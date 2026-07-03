import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Encryption Key Management Service
 * Ensures secure encryption key handling and validation
 */
@Injectable()
export class EncryptionKeyService {
  private readonly logger = new Logger(EncryptionKeyService.name);
  private encryptionKeyBuffer: Buffer | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeEncryptionKey();
  }

  /**
   * Initialize and validate encryption key
   * Throws error if key is missing or invalid in production
   */
  private initializeEncryptionKey(): void {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Validate key presence based on environment
    if (nodeEnv === 'production') {
      if (!encryptionKey) {
        throw new Error(
          'ENCRYPTION_KEY is REQUIRED in production environment for secure messaging'
        );
      }

      if (encryptionKey.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 characters long in production');
      }

      // Validate key strength (check for weak patterns)
      if (this.isWeakKey(encryptionKey)) {
        throw new Error('ENCRYPTION_KEY is too weak - must contain mixed alphanumeric characters');
      }

      this.logger.log('✅ Encryption key validation passed for production');
    } else {
      // Development/Testing environments
      if (!encryptionKey) {
        this.logger.warn('⚠️  ENCRYPTION_KEY not set - using default development key');
        // In development, we can use a default key for testing
        process.env.ENCRYPTION_KEY = 'dev-default-key-32-characters!!';
      } else if (encryptionKey.length !== 32) {
        this.logger.warn(
          '⚠️  ENCRYPTION_KEY should be 32 characters - using anyway in development'
        );
      }
    }

    // Store the key buffer
    this.encryptionKeyBuffer = Buffer.from(process.env.ENCRYPTION_KEY!, 'utf8');
    this.isInitialized = true;
  }

  /**
   * Check if encryption key is weak/predictable
   */
  private isWeakKey(key: string): boolean {
    // Check for common weak patterns
    const weakPatterns = [
      /^a+$/, // All 'a's
      /^1+$/, // All '1's
      /^(.)\1+$/, // All same character
      /^test|^dev|^default/i, // Common test words
    ];

    return weakPatterns.some((pattern) => pattern.test(key));
  }

  /**
   * Get the validated encryption key buffer
   */
  getKey(): Buffer {
    if (!this.isInitialized || !this.encryptionKeyBuffer) {
      throw new Error('Encryption service not properly initialized');
    }
    return this.encryptionKeyBuffer;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const key = this.getKey();
    const iv = crypto.randomBytes(16); // 128-bit IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
    const key = this.getKey();
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate a secure encryption key
   */
  static generateSecureKey(): string {
    return crypto.randomBytes(16).toString('hex'); // 32 hex characters
  }

  /**
   * Validate if a key meets security requirements
   */
  static validateKey(key: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!key) {
      errors.push('Key is required');
      return { isValid: false, errors };
    }

    if (key.length !== 32) {
      errors.push('Key must be exactly 32 characters long');
    }

    // Check for character variety
    const hasLetters = /[a-zA-Z]/.test(key);
    const hasNumbers = /[0-9]/.test(key);

    if (!hasLetters || !hasNumbers) {
      errors.push('Key must contain both letters and numbers');
    }

    // Check for predictable patterns
    if (/^(.)\1+$/.test(key)) {
      errors.push('Key cannot consist of repeated characters');
    }

    if (/^test|^dev|^default/i.test(key)) {
      errors.push('Key cannot be a common test word');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get key rotation status and recommendations
   */
  getKeyHealth(): KeyHealthReport {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const key = process.env.ENCRYPTION_KEY || '';

    const validation = EncryptionKeyService.validateKey(key);
    const isProduction = nodeEnv === 'production';

    return {
      isInitialized: this.isInitialized,
      isValid: validation.isValid,
      isProductionReady: isProduction ? validation.isValid : true,
      errors: validation.errors,
      environment: nodeEnv,
      recommendations: this.getRecommendations(nodeEnv, validation.isValid),
    };
  }

  /**
   * Get security recommendations based on current state
   */
  private getRecommendations(environment: string, isKeyValid: boolean): string[] {
    const recommendations: string[] = [];

    if (environment === 'production' && !isKeyValid) {
      recommendations.push('❌ Set a valid 32-character ENCRYPTION_KEY in production environment');
      recommendations.push(
        "❌ Generate secure key using: node -e \"console.log(require('crypto').randomBytes(16).toString('hex'))\""
      );
    } else if (environment === 'production' && isKeyValid) {
      recommendations.push('✅ Encryption key is properly configured for production');
    } else if (environment !== 'production') {
      recommendations.push('ℹ️  Running in development mode - encryption key validation relaxed');
      if (!process.env.ENCRYPTION_KEY) {
        recommendations.push('💡 Consider setting ENCRYPTION_KEY for consistent testing');
      }
    }

    return recommendations;
  }
}

// Types
export interface KeyHealthReport {
  isInitialized: boolean;
  isValid: boolean;
  isProductionReady: boolean;
  errors: string[];
  environment: string;
  recommendations: string[];
}
