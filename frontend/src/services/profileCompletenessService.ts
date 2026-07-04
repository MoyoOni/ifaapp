/**
 * ProfileCompletenessService - Calculate and manage profile completion scores
 * Different calculation logic for each user role
 */

import { UserRole } from '@common';

export interface CompletionScore {
  overall: number; // 0-100%
  tier: 'incomplete' | 'partial' | 'complete';
  color: string;
  message: string;
  missingItems: MissingItem[];
  completedItems: string[];
}

export interface MissingItem {
  field: string;
  label: string;
  weight: number;
  section: string; // 'basic' | 'professional' | 'engagement'
  ctaText: string;
  ctaRoute: string;
}

class ProfileCompletenessService {
  /**
   * Weights for CLIENT profile completion
   */
  private CLIENT_WEIGHTS: Record<string, number> = {
    avatar: 20,
    yoruba_name: 15,
    location: 15,
    consultation_booked: 20,
    temple_joined: 15,
    circle_joined: 15,
  };

  /**
   * Weights for BABALAWO profile completion
   */
  private BABALAWO_WEIGHTS: Record<string, number> = {
    avatar: 15,
    yoruba_name: 10,
    location: 10,
    bio: 20,
    service_offering: 15,
    verification_docs: 20,
    availability: 10,
  };

  /**
   * Weights for VENDOR profile completion
   */
  private VENDOR_WEIGHTS: Record<string, number> = {
    avatar: 15,
    shop_name: 15,
    description: 15,
    first_product: 20,
    delivery_zones: 15,
    guidelines_accepted: 10,
    cultural_pledge: 10,
  };

  /**
   * Calculate completeness score for any user
   */
  calculateScore(
    userData: any,
    role: UserRole,
  ): CompletionScore {
    const weights = this.getWeightsForRole(role);
    const filledItems = this.checkFilledItems(userData, role);

    let score = 0;
    let totalWeight = 0;

    // Calculate weighted score
    for (const [field, weight] of Object.entries(weights)) {
      totalWeight += weight;
      if (filledItems[field]) {
        score += weight;
      }
    }

    const overall = Math.round((score / totalWeight) * 100);
    const tier = this.getTier(overall);
    const color = this.getTierColor(tier);
    const message = this.getTierMessage(tier, overall);
    const missingItems = this.getMissingItems(userData, role, filledItems);
    const completedItems = Object.keys(filledItems).filter(field => filledItems[field]);

    return {
      overall,
      tier,
      color,
      message,
      missingItems,
      completedItems,
    };
  }

  /**
   * Get missing items with CTA information
   */
  private getMissingItems(
    userData: any,
    role: UserRole,
    filledItems: Record<string, boolean>,
  ): MissingItem[] {
    const items: MissingItem[] = [];

    const configs: Record<string, Record<string, any>> = {
      CLIENT: {
        avatar: {
          label: 'Profile photo',
          weight: 20,
          section: 'basic',
          ctaText: 'Upload photo',
          ctaRoute: '/profile/edit?step=avatar',
        },
        yoruba_name: {
          label: 'Yoruba name',
          weight: 15,
          section: 'basic',
          ctaText: 'Add name',
          ctaRoute: '/profile/edit?step=yoruba-name',
        },
        location: {
          label: 'Location',
          weight: 15,
          section: 'basic',
          ctaText: 'Set location',
          ctaRoute: '/profile/edit?step=location',
        },
        consultation_booked: {
          label: 'Book your first consultation',
          weight: 20,
          section: 'engagement',
          ctaText: 'Browse Babalawo',
          ctaRoute: '/discovery/babalawo',
        },
        temple_joined: {
          label: 'Join a temple',
          weight: 15,
          section: 'engagement',
          ctaText: 'Find temples',
          ctaRoute: '/temples',
        },
        circle_joined: {
          label: 'Join a circle',
          weight: 15,
          section: 'engagement',
          ctaText: 'Browse circles',
          ctaRoute: '/circles',
        },
      },
      BABALAWO: {
        avatar: {
          label: 'Profile photo',
          weight: 15,
          section: 'basic',
          ctaText: 'Upload photo',
          ctaRoute: '/profile/edit?step=avatar',
        },
        yoruba_name: {
          label: 'Yoruba name',
          weight: 10,
          section: 'basic',
          ctaText: 'Add name',
          ctaRoute: '/profile/edit?step=yoruba-name',
        },
        location: {
          label: 'Location',
          weight: 10,
          section: 'basic',
          ctaText: 'Set location',
          ctaRoute: '/profile/edit?step=location',
        },
        bio: {
          label: 'Practice bio',
          weight: 20,
          section: 'professional',
          ctaText: 'Write bio',
          ctaRoute: '/profile/edit?step=bio',
        },
        service_offering: {
          label: 'Service offerings',
          weight: 15,
          section: 'professional',
          ctaText: 'Add services',
          ctaRoute: '/services/create',
        },
        verification_docs: {
          label: 'Verification documents',
          weight: 20,
          section: 'professional',
          ctaText: 'Upload docs',
          ctaRoute: '/verification',
        },
        availability: {
          label: 'Availability slots',
          weight: 10,
          section: 'professional',
          ctaText: 'Set hours',
          ctaRoute: '/calendar/availability',
        },
      },
      VENDOR: {
        avatar: {
          label: 'Shop photo',
          weight: 15,
          section: 'basic',
          ctaText: 'Upload photo',
          ctaRoute: '/shop/settings?step=avatar',
        },
        shop_name: {
          label: 'Shop name',
          weight: 15,
          section: 'basic',
          ctaText: 'Set name',
          ctaRoute: '/shop/settings?step=name',
        },
        description: {
          label: 'Shop description',
          weight: 15,
          section: 'professional',
          ctaText: 'Write description',
          ctaRoute: '/shop/settings?step=description',
        },
        first_product: {
          label: 'List first product',
          weight: 20,
          section: 'professional',
          ctaText: 'Add product',
          ctaRoute: '/products/create',
        },
        delivery_zones: {
          label: 'Delivery zones',
          weight: 15,
          section: 'professional',
          ctaText: 'Configure delivery',
          ctaRoute: '/shop/settings?step=delivery',
        },
        guidelines_accepted: {
          label: 'Cultural guidelines',
          weight: 10,
          section: 'professional',
          ctaText: 'Review guidelines',
          ctaRoute: '/marketplace/guidelines',
        },
        cultural_pledge: {
          label: 'Cultural pledge',
          weight: 10,
          section: 'professional',
          ctaText: 'Sign pledge',
          ctaRoute: '/shop/settings?step=pledge',
        },
      },
      ADMIN: {
        // Admins don't have a completion score
      },
    };

    const roleConfig = configs[role];
    if (!roleConfig) return [];

    for (const [field, config] of Object.entries(roleConfig)) {
      if (!filledItems[field]) {
        items.push({
          field,
          label: config.label,
          weight: config.weight,
          section: config.section,
          ctaText: config.ctaText,
          ctaRoute: config.ctaRoute,
        });
      }
    }

    // Sort by weight (most impactful first)
    return items.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Check which fields are filled in user data
   */
  private checkFilledItems(userData: any, role: UserRole): Record<string, boolean> {
    const filled: Record<string, boolean> = {};

    if (role === 'CLIENT') {
      filled.avatar = !!userData?.avatar;
      filled.yoruba_name = !!userData?.yorubaName;
      filled.location = !!userData?.location;
      filled.consultation_booked = (userData?.consultationCount || 0) > 0;
      filled.temple_joined = (userData?.templeIds || []).length > 0;
      filled.circle_joined = (userData?.circleIds || []).length > 0;
    } else if (role === 'BABALAWO') {
      filled.avatar = !!userData?.avatar;
      filled.yoruba_name = !!userData?.yorubaName;
      filled.location = !!userData?.location;
      filled.bio = !!userData?.bio && userData.bio.length > 50;
      filled.service_offering = (userData?.serviceOfferings || []).length > 0;
      filled.verification_docs = userData?.verificationStatus === 'verified';
      filled.availability = (userData?.availabilitySlots || []).length > 0;
    } else if (role === 'VENDOR') {
      filled.avatar = !!userData?.avatar;
      filled.shop_name = !!userData?.shopName;
      filled.description = !!userData?.description;
      filled.first_product = (userData?.productCount || 0) > 0;
      filled.delivery_zones = (userData?.deliveryZones || []).length > 0;
      filled.guidelines_accepted = userData?.guidelinesAccepted === true;
      filled.cultural_pledge = userData?.culturalPledgeSigned === true;
    }

    return filled;
  }

  /**
   * Get weights for user role
   */
  private getWeightsForRole(role: UserRole): Record<string, number> {
    switch (role) {
      case 'CLIENT':
        return this.CLIENT_WEIGHTS;
      case 'BABALAWO':
        return this.BABALAWO_WEIGHTS;
      case 'VENDOR':
        return this.VENDOR_WEIGHTS;
      default:
        return {};
    }
  }

  /**
   * Get tier based on score
   */
  private getTier(score: number): 'incomplete' | 'partial' | 'complete' {
    if (score < 40) return 'incomplete';
    if (score < 70) return 'partial';
    return 'complete';
  }

  /**
   * Get color for tier
   */
  private getTierColor(tier: 'incomplete' | 'partial' | 'complete'): string {
    switch (tier) {
      case 'incomplete':
        return '#ef4444'; // Red
      case 'partial':
        return '#f59e0b'; // Amber
      case 'complete':
        return '#10b981'; // Green
    }
  }

  /**
   * Get message for tier
   */
  private getTierMessage(tier: 'incomplete' | 'partial' | 'complete', score: number): string {
    switch (tier) {
      case 'incomplete':
        return `Your profile is ${score}% complete — let's get started!`;
      case 'partial':
        return `Your profile is ${score}% complete — almost there!`;
      case 'complete':
        return `Your profile is fully complete! 🎉`;
    }
  }
}

// Export singleton instance
export const profileCompletenessService = new ProfileCompletenessService();
