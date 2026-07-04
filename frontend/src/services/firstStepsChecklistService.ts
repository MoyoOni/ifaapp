/**
 * FirstStepsChecklistService - Manage post-onboarding checklist
 */
import { logger } from '@/shared/utils/logger';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  route: string;
  icon: string;
  section: 'essential' | 'engagement' | 'advanced';
}

export interface ChecklistState {
  userId: string;
  userRole: 'CLIENT' | 'BABALAWO' | 'VENDOR';
  items: ChecklistItem[];
  completedCount: number;
  dismissedAt?: number;
  lastViewedAt: number;
}

type UserRole = 'CLIENT' | 'BABALAWO' | 'VENDOR';

class FirstStepsChecklistService {
  private STORAGE_PREFIX = 'first-steps-checklist';
  private DISMISS_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 days

  /**
   * Get default checklist items for a role
   */
  private getDefaultItems(role: UserRole): ChecklistItem[] {
    const items: Record<UserRole, ChecklistItem[]> = {
      CLIENT: [
        {
          id: 'profile',
          label: 'Complete your profile',
          description: 'Add your photo, name, and location to get started',
          completed: false,
          route: '/profile/edit',
          icon: '👤',
          section: 'essential',
        },
        {
          id: 'explore-temples',
          label: 'Browse temples near you',
          description: 'Discover spiritual communities and temples',
          completed: false,
          route: '/temples',
          icon: '🏛️',
          section: 'engagement',
        },
        {
          id: 'first-booking',
          label: 'Book your first consultation',
          description: 'Find and book a consultation with a Babalawo',
          completed: false,
          route: '/discovery/babalawo',
          icon: '📅',
          section: 'essential',
        },
        {
          id: 'explore-academy',
          label: 'Explore the Academy',
          description: 'Learn courses and spiritual guidance',
          completed: false,
          route: '/academy',
          icon: '📚',
          section: 'engagement',
        },
        {
          id: 'join-circle',
          label: 'Join a circle',
          description: 'Connect with others in your spiritual community',
          completed: false,
          route: '/circles',
          icon: '👥',
          section: 'engagement',
        },
      ],
      BABALAWO: [
        {
          id: 'complete-profile',
          label: 'Complete your profile',
          description: 'Add your photo, bio, and practice information',
          completed: false,
          route: '/profile/edit',
          icon: '👤',
          section: 'essential',
        },
        {
          id: 'verification',
          label: 'Upload verification documents',
          description: 'Get verified to appear in discovery listings',
          completed: false,
          route: '/verification',
          icon: '✓',
          section: 'essential',
        },
        {
          id: 'availability',
          label: 'Set your availability',
          description: 'Configure your calendar and booking slots',
          completed: false,
          route: '/calendar/availability',
          icon: '⏰',
          section: 'essential',
        },
        {
          id: 'services',
          label: 'Create service offerings',
          description: 'Define the services you provide',
          completed: false,
          route: '/services/create',
          icon: '💼',
          section: 'engagement',
        },
        {
          id: 'temple-connect',
          label: 'Connect to a temple',
          description: 'Link your profile to a spiritual community',
          completed: false,
          route: '/temples/connect',
          icon: '🔗',
          section: 'advanced',
        },
      ],
      VENDOR: [
        {
          id: 'shop-profile',
          label: 'Complete your shop profile',
          description: 'Add your shop name, photo, and description',
          completed: false,
          route: '/shop/settings',
          icon: '🛍️',
          section: 'essential',
        },
        {
          id: 'guidelines',
          label: 'Review cultural guidelines',
          description: 'Understand cultural authenticity requirements',
          completed: false,
          route: '/marketplace/guidelines',
          icon: '📋',
          section: 'essential',
        },
        {
          id: 'first-product',
          label: 'List your first product',
          description: 'Add and configure your first product',
          completed: false,
          route: '/products/create',
          icon: '📦',
          section: 'essential',
        },
        {
          id: 'delivery-zones',
          label: 'Set delivery zones',
          description: 'Configure where you deliver',
          completed: false,
          route: '/shop/settings?step=delivery',
          icon: '🌍',
          section: 'engagement',
        },
        {
          id: 'cultural-pledge',
          label: 'Sign cultural pledge',
          description: 'Commit to cultural authenticity standards',
          completed: false,
          route: '/shop/settings?step=pledge',
          icon: '🤝',
          section: 'advanced',
        },
      ],
    };

    return items[role];
  }

  /**
   * Initialize or get checklist for user
   */
  getChecklist(userId: string, userRole: UserRole): ChecklistState {
    const stored = this.getStoredChecklist(userId);

    if (stored) {
      // Check if checklist should auto-dismiss (14 days old)
      if (stored.dismissedAt && Date.now() - stored.dismissedAt > this.DISMISS_DURATION) {
        // Auto-dismiss old checklists
        return {
          ...stored,
          dismissedAt: undefined,
        };
      }
      return stored;
    }

    // Create new checklist
    const newChecklist: ChecklistState = {
      userId,
      userRole,
      items: this.getDefaultItems(userRole),
      completedCount: 0,
      lastViewedAt: Date.now(),
    };

    this.saveChecklist(newChecklist);
    return newChecklist;
  }

  /**
   * Mark item as complete
   */
  completeItem(userId: string, itemId: string): ChecklistState | null {
    const checklist = this.getStoredChecklist(userId);
    if (!checklist) return null;

    const item = checklist.items.find(i => i.id === itemId);
    if (item && !item.completed) {
      item.completed = true;
      checklist.completedCount = checklist.items.filter(i => i.completed).length;
      checklist.lastViewedAt = Date.now();
      this.saveChecklist(checklist);
    }

    return checklist;
  }

  /**
   * Mark item as incomplete (for testing)
   */
  uncompleteItem(userId: string, itemId: string): ChecklistState | null {
    const checklist = this.getStoredChecklist(userId);
    if (!checklist) return null;

    const item = checklist.items.find(i => i.id === itemId);
    if (item && item.completed) {
      item.completed = false;
      checklist.completedCount = checklist.items.filter(i => i.completed).length;
      this.saveChecklist(checklist);
    }

    return checklist;
  }

  /**
   * Dismiss checklist for specified duration
   */
  dismissChecklist(userId: string): ChecklistState | null {
    const checklist = this.getStoredChecklist(userId);
    if (!checklist) return null;

    checklist.dismissedAt = Date.now();
    this.saveChecklist(checklist);
    return checklist;
  }

  /**
   * Check if checklist should be visible
   */
  shouldShowChecklist(userId: string): boolean {
    const checklist = this.getStoredChecklist(userId);
    if (!checklist) return false;

    // Show if not dismissed or dismissal period expired
    if (!checklist.dismissedAt) return true;

    const now = Date.now();
    const dismissedDuration = now - checklist.dismissedAt;

    // Show if: not fully complete, dismissed < 7 days ago, or 14 days passed since creation
    return (
      checklist.completedCount < checklist.items.length &&
      (dismissedDuration < 7 * 24 * 60 * 60 * 1000 || dismissedDuration > this.DISMISS_DURATION)
    );
  }

  /**
   * Get completion percentage
   */
  getProgress(userId: string): number {
    const checklist = this.getStoredChecklist(userId);
    if (!checklist || checklist.items.length === 0) return 0;
    return Math.round((checklist.completedCount / checklist.items.length) * 100);
  }

  /**
   * Get items by section
   */
  getItemsBySection(userId: string, userRole: UserRole) {
    const checklist = this.getChecklist(userId, userRole);

    const grouped: Record<string, ChecklistItem[]> = {
      essential: [],
      engagement: [],
      advanced: [],
    };

    checklist.items.forEach(item => {
      grouped[item.section].push(item);
    });

    return grouped;
  }

  /**
   * Get next recommended item
   */
  getNextItem(userId: string, userRole: UserRole): ChecklistItem | null {
    const checklist = this.getChecklist(userId, userRole);

    // Priority: essential > engagement > advanced
    const sections = ['essential', 'engagement', 'advanced'];

    for (const section of sections) {
      const item = checklist.items.find(i => i.section === section && !i.completed);
      if (item) return item;
    }

    return null;
  }

  /**
   * Reset checklist (for testing)
   */
  resetChecklist(userId: string): void {
    const key = `${this.STORAGE_PREFIX}:${userId}`;
    localStorage.removeItem(key);
  }

  // Private methods

  private getStoredChecklist(userId: string): ChecklistState | null {
    try {
      const key = `${this.STORAGE_PREFIX}:${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.warn('[FirstStepsChecklistService] Failed to retrieve checklist', error);
      return null;
    }
  }

  private saveChecklist(checklist: ChecklistState): void {
    try {
      const key = `${this.STORAGE_PREFIX}:${checklist.userId}`;
      localStorage.setItem(key, JSON.stringify(checklist));
    } catch (error) {
      logger.warn('[FirstStepsChecklistService] Failed to save checklist', error);
    }
  }
}

export const firstStepsChecklistService = new FirstStepsChecklistService();
