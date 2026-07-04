import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileCompletenessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculates the profile completeness for a user
   */
  async calculateProfileCompleteness(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        avatar: true,
        yorubaName: true,
        location: true,
        bio: true,
        aboutMe: true,
        interests: true,
        whatsappNumber: true,
        gender: true,
        age: true,
        dialectPreference: true,
        appointmentsAsClient: { take: 1 },
        babalawoReviews: { take: 1 },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Define profile elements and their weights
    const profileElements = [
      { key: 'avatar', weight: 15, value: !!user.avatar },
      { key: 'yorubaName', weight: 10, value: !!user.yorubaName },
      { key: 'location', weight: 10, value: !!user.location },
      { key: 'bio', weight: 10, value: !!user.bio },
      { key: 'aboutMe', weight: 10, value: !!user.aboutMe },
      { key: 'interests', weight: 5, value: user.interests && user.interests.length > 0 },
      { key: 'whatsapp', weight: 5, value: !!user.whatsappNumber },
      { key: 'gender', weight: 5, value: !!user.gender },
      { key: 'age', weight: 5, value: !!user.age },
      { key: 'dialect', weight: 5, value: !!user.dialectPreference },
      { key: 'firstConsultation', weight: 10, value: user.appointmentsAsClient.length > 0 },
      { key: 'firstReview', weight: 10, value: user.babalawoReviews.length > 0 },
    ];

    // Calculate weighted completeness
    let totalWeight = 0;
    let completedWeight = 0;

    profileElements.forEach((element) => {
      totalWeight += element.weight;
      if (element.value) {
        completedWeight += element.weight;
      }
    });

    const completenessPercentage = Math.round((completedWeight / totalWeight) * 100);

    // Determine tier based on percentage
    let tier: 'incomplete' | 'partial' | 'complete';
    if (completenessPercentage < 50) {
      tier = 'incomplete';
    } else if (completenessPercentage < 80) {
      tier = 'partial';
    } else {
      tier = 'complete';
    }

    return {
      percentage: completenessPercentage,
      tier,
      elements: profileElements.map((el) => ({
        id: el.key,
        completed: el.value,
        weight: el.weight,
      })),
      completedCount: profileElements.filter((el) => el.value).length,
      totalCount: profileElements.length,
    };
  }

  /**
   * Gets the next recommended steps for profile completion
   */
  async getNextSteps(userId: string) {
    const completeness = await this.calculateProfileCompleteness(userId);

    // Filter for uncompleted elements and sort by weight (priority)
    const uncompletedElements = completeness.elements
      .filter((el) => !el.completed)
      .sort((a, b) => b.weight - a.weight);

    // Return top 3 recommended next steps
    return uncompletedElements.slice(0, 3).map((el) => el.id);
  }
}
