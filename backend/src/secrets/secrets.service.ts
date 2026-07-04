import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private secretsManagerClient: SecretsManagerClient | null = null;

  constructor(private configService: ConfigService) {
    // Initialize AWS Secrets Manager client for production/staging environments
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production' || nodeEnv === 'staging') {
      try {
        this.secretsManagerClient = new SecretsManagerClient({
          region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
        });
        this.logger.log('AWS Secrets Manager client initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize AWS Secrets Manager client:', error);
        this.secretsManagerClient = null;
      }
    } else {
      this.logger.log(
        'Skipping AWS Secrets Manager client initialization (not in production/staging)'
      );
    }
  }

  /**
   * Get a secret value from AWS Secrets Manager (production/staging) or environment variables (development)
   */
  async getSecret(secretName: string): Promise<string> {
    // In production/staging, try AWS Secrets Manager first
    if (this.secretsManagerClient) {
      try {
        const command = new GetSecretValueCommand({
          SecretId: secretName,
        });

        const response = await this.secretsManagerClient.send(command);
        if (response.SecretString) {
          this.logger.log(`Retrieved secret from AWS Secrets Manager: ${secretName}`);
          return response.SecretString;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to retrieve secret from AWS Secrets Manager: ${secretName}`,
          error
        );
        // Fall back to environment variables
      }
    }

    // Fall back to environment variables (development or AWS failure)
    const envVarName = this.convertToEnvVarName(secretName);
    const envValue = this.configService.get<string>(envVarName);
    if (!envValue) {
      const errorMsg = this.secretsManagerClient
        ? `Environment variable ${envVarName} is not set and secret ${secretName} not found in AWS Secrets Manager`
        : `Environment variable ${envVarName} is not set`;
      throw new Error(errorMsg);
    }

    this.logger.log(`Retrieved secret from environment variable: ${envVarName}`);
    return envValue;
  }

  /**
   * Convert a secret name to an environment variable name
   * Example: 'iluase/prod/sentry-dsn' -> 'SENTRY_DSN'
   */
  private convertToEnvVarName(secretName: string): string {
    // Extract the last part after the final '/'
    const parts = secretName.split('/');
    const lastPart = parts[parts.length - 1];

    // Convert to uppercase and replace non-alphanumeric characters with underscores
    return lastPart.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  }
}
