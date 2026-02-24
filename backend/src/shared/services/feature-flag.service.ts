import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number; // 0-100 percentage of users affected
  targeting?: FeatureTargeting;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureTargeting {
  userIds?: string[]; // Specific user IDs to target
  roleBased?: string[]; // Roles to target (e.g., 'ADMIN', 'PREMIUM')
  segmentBased?: string[]; // Segments to target (e.g., 'REGION_US', 'DEVICE_MOBILE')
}

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly FEATURE_FLAGS_KEY = 'feature_flags';
  private readonly USER_FEATURE_OVERRIDES_KEY = 'user_feature_overrides';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Creates or updates a feature flag
   */
  async setFeatureFlag(flag: FeatureFlag): Promise<void> {
    try {
      // Store the feature flag in Redis
      await this.redisService.set(
        `${this.FEATURE_FLAGS_KEY}:${flag.key}`,
        JSON.stringify({
          ...flag,
          createdAt: flag.createdAt.toISOString(),
          updatedAt: flag.updatedAt.toISOString(),
        }),
        86400 // 24 hours expiry
      );

      this.logger.log(`Set feature flag: ${flag.key} (enabled: ${flag.enabled})`);
    } catch (error: any) {
      this.logger.error(`Failed to set feature flag ${flag.key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets a feature flag by key
   */
  async getFeatureFlag(key: string): Promise<FeatureFlag | null> {
    try {
      const flagString = await this.redisService.get(`${this.FEATURE_FLAGS_KEY}:${key}`);
      
      if (!flagString) {
        return null;
      }

      const parsed = JSON.parse(flagString);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get feature flag ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checks if a feature is enabled for a specific user
   */
  async isFeatureEnabled(featureKey: string, userId?: string, userRole?: string, userSegment?: string): Promise<boolean> {
    try {
      const flag = await this.getFeatureFlag(featureKey);
      
      if (!flag) {
        this.logger.warn(`Feature flag ${featureKey} not found`);
        return false;
      }

      if (!flag.enabled) {
        return false;
      }

      // Check for user-specific override
      if (userId) {
        const override = await this.getUserFeatureOverride(featureKey, userId);
        if (override !== null) {
          return override;
        }
      }

      // Check if feature has targeting rules
      if (flag.targeting) {
        // Check user ID targeting
        if (flag.targeting.userIds && userId && flag.targeting.userIds.includes(userId)) {
          return true;
        }

        // Check role-based targeting
        if (flag.targeting.roleBased && userRole && flag.targeting.roleBased.includes(userRole)) {
          return true;
        }

        // Check segment-based targeting
        if (flag.targeting.segmentBased && userSegment && flag.targeting.segmentBased.includes(userSegment)) {
          return true;
        }
      }

      // Check rollout percentage if applicable
      if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
        if (userId) {
          // Use consistent hashing to determine if user is in the rollout percentage
          const hashValue = this.simpleHash(userId) % 100;
          return hashValue < flag.rolloutPercentage;
        } else {
          // For users without ID, use a random approach (less consistent)
          return Math.random() * 100 < flag.rolloutPercentage;
        }
      }

      // If no special conditions apply, return the general enabled state
      return flag.enabled;
    } catch (error: any) {
      this.logger.error(`Failed to check feature flag ${featureKey}: ${error.message}`);
      return false; // Fail safely
    }
  }

  /**
   * Sets a user-specific override for a feature flag
   */
  async setUserFeatureOverride(featureKey: string, userId: string, enabled: boolean): Promise<void> {
    try {
      const key = `${this.USER_FEATURE_OVERRIDES_KEY}:${featureKey}:${userId}`;
      await this.redisService.set(key, enabled.toString(), 86400); // 24 hours expiry
      
      this.logger.log(`Set user override for feature ${featureKey} (user: ${userId}): ${enabled}`);
    } catch (error: any) {
      this.logger.error(`Failed to set user override for feature ${featureKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets a user-specific override for a feature flag
   */
  async getUserFeatureOverride(featureKey: string, userId: string): Promise<boolean | null> {
    try {
      const key = `${this.USER_FEATURE_OVERRIDES_KEY}:${featureKey}:${userId}`;
      const value = await this.redisService.get(key);
      
      if (value === null || value === undefined) {
        return null;
      }

      return value.toLowerCase() === 'true';
    } catch (error: any) {
      this.logger.error(`Failed to get user override for feature ${featureKey}: ${error.message}`);
      return null;
    }
  }

  /**
   * Removes a user-specific override for a feature flag
   */
  async removeUserFeatureOverride(featureKey: string, userId: string): Promise<void> {
    try {
      const key = `${this.USER_FEATURE_OVERRIDES_KEY}:${featureKey}:${userId}`;
      await this.redisService.del(key);
      
      this.logger.log(`Removed user override for feature ${featureKey} (user: ${userId})`);
    } catch (error: any) {
      this.logger.error(`Failed to remove user override for feature ${featureKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lists all feature flags
   */
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const keys = await this.redisService.keys(`${this.FEATURE_FLAGS_KEY}:*`);
      const flags: FeatureFlag[] = [];

      for (const key of keys) {
        const flagString = await this.redisService.get(key);
        if (flagString) {
          const parsed = JSON.parse(flagString);
          flags.push({
            ...parsed,
            createdAt: new Date(parsed.createdAt),
            updatedAt: new Date(parsed.updatedAt),
          });
        }
      }

      return flags;
    } catch (error: any) {
      this.logger.error(`Failed to get all feature flags: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a feature flag
   */
  async deleteFeatureFlag(key: string): Promise<void> {
    try {
      await this.redisService.del(`${this.FEATURE_FLAGS_KEY}:${key}`);
      // Also delete all user overrides for this feature
      const overrideKeys = await this.redisService.keys(`${this.USER_FEATURE_OVERRIDES_KEY}:${key}:*`);
      for (const overrideKey of overrideKeys) {
        await this.redisService.del(overrideKey);
      }
      
      this.logger.log(`Deleted feature flag: ${key}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete feature flag ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simple hash function for consistent user assignment to rollout percentages
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}