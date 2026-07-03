import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateVerificationApplicationDto } from './dto/create-verification-application.dto';

export interface SkillAssessment {
  id: string;
  userId: string;
  assessmentType: 'KNOWLEDGE' | 'PRACTICAL' | 'ETHICS';
  score: number;
  maxScore: number;
  dateTaken: Date;
  status: 'PASSED' | 'FAILED' | 'PENDING_REVIEW';
  feedback?: string;
}

export interface QualityMonitoringRecord {
  id: string;
  userId: string;
  metricType: 'CONSULTATION_FEEDBACK' | 'PEER_REVIEW' | 'ADMIN_REVIEW' | 'COMMUNITY_REPORT';
  value: number;
  dateRecorded: Date;
  reviewerId?: string;
  notes?: string;
}

@Injectable()
export class EnhancedPractitionerOnboardingService {
  private readonly logger = new Logger(EnhancedPractitionerOnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates an enhanced verification application with skill assessments
   */
  async createEnhancedApplication(
    userId: string,
    applicationData: CreateVerificationApplicationDto,
  ): Promise<any> {
    this.logger.log(`Creating enhanced verification application for user: ${userId}`);

    // First, create the standard verification application
    const standardApplication = await this.prisma.verificationApplication.create({
      data: {
        userId,
        lineage: applicationData.lineage,
        mentorEndorsements: applicationData.mentorEndorsements,
        yearsOfService: applicationData.yearsOfService,
        documentation: applicationData.documentation,
        specialization: applicationData.specialization,
        languages: applicationData.languages,
        currentStage: 'APPLICATION',
        status: 'PENDING',
      },
    });

    // Then create skill assessments based on the practitioner's specialization
    const assessments = await this.createInitialSkillAssessments(userId, applicationData.specialization);

    // Update user's onboarding status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: 'VERIFICATION_SUBMITTED',
      },
    });

    this.logger.log(`Enhanced verification application created with ID: ${standardApplication.id}`);

    return {
      application: standardApplication,
      assessments,
    };
  }

  /**
   * Creates initial skill assessments based on specialization
   */
  private async createInitialSkillAssessments(userId: string, specializations: string[]): Promise<SkillAssessment[]> {
    const assessments: SkillAssessment[] = [];

    // Create knowledge assessment for each specialization
    for (const specialization of specializations) {
      const knowledgeAssessment = await this.prisma.skillAssessment.create({
        data: {
          userId,
          assessmentType: 'KNOWLEDGE',
          score: 0,
          maxScore: 100,
          dateTaken: new Date(),
          status: 'PENDING_REVIEW',
          specialization,
        },
      });
      assessments.push(knowledgeAssessment);
    }

    // Create practical assessment
    const practicalAssessment = await this.prisma.skillAssessment.create({
      data: {
        userId,
        assessmentType: 'PRACTICAL',
        score: 0,
        maxScore: 100,
        dateTaken: new Date(),
        status: 'PENDING_REVIEW',
        specialization: specializations.join(','),
      },
    });
    assessments.push(practicalAssessment);

    // Create ethics assessment
    const ethicsAssessment = await this.prisma.skillAssessment.create({
      data: {
        userId,
        assessmentType: 'ETHICS',
        score: 0,
        maxScore: 100,
        dateTaken: new Date(),
        status: 'PENDING_REVIEW',
        specialization: specializations.join(','),
      },
    });
    assessments.push(ethicsAssessment);

    this.logger.log(`Created ${assessments.length} initial skill assessments for user: ${userId}`);

    return assessments;
  }

  /**
   * Submit answers for a skill assessment
   */
  async submitAssessmentAnswers(
    userId: string,
    assessmentId: string,
    answers: Array<{ questionId: string; selectedOption: string; score: number }>,
  ): Promise<SkillAssessment> {
    this.logger.log(`Submitting answers for assessment: ${assessmentId} by user: ${userId}`);

    // Calculate total score from answers
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const maxPossibleScore = answers.length * 10; // Assuming max 10 points per question

    // Update the assessment with the calculated score
    const updatedAssessment = await this.prisma.skillAssessment.update({
      where: { id: assessmentId, userId },
      data: {
        score: totalScore,
        maxScore: maxPossibleScore,
        dateTaken: new Date(),
        status: totalScore / maxPossibleScore >= 0.7 ? 'PASSED' : 'FAILED', // 70% required to pass
      },
    });

    // If assessment is part of verification, update the overall verification status
    const application = await this.prisma.verificationApplication.findFirst({
      where: { userId },
    });

    if (application) {
      await this.updateVerificationStatus(application.id);
    }

    this.logger.log(`Assessment ${assessmentId} submitted with status: ${updatedAssessment.status}`);

    return updatedAssessment;
  }

  /**
   * Updates the verification application status based on completed assessments
   */
  private async updateVerificationStatus(applicationId: string): Promise<void> {
    // Get all assessments for this user's application
    const assessments = await this.prisma.skillAssessment.findMany({
      where: { 
        userId: (await this.prisma.verificationApplication.findUnique({ 
          where: { id: applicationId } 
        })).userId 
      },
    });

    // Check if all assessments are completed and passed
    const allCompleted = assessments.every(ass => ass.status !== 'PENDING_REVIEW');
    const allPassed = assessments.every(ass => ass.status === 'PASSED');

    if (allCompleted && allPassed) {
      await this.prisma.verificationApplication.update({
        where: { id: applicationId },
        data: {
          currentStage: 'COUNCIL_REVIEW',
          status: 'PENDING',
        },
      });
    } else if (allCompleted && !allPassed) {
      await this.prisma.verificationApplication.update({
        where: { id: applicationId },
        data: {
          currentStage: 'FAILED_ASSESSMENTS',
          status: 'REQUIRES_ATTENTION',
        },
      });
    }
  }

  /**
   * Record quality monitoring metrics for a practitioner
   */
  async recordQualityMetric(
    userId: string,
    metricType: QualityMonitoringRecord['metricType'],
    value: number,
    reviewerId?: string,
    notes?: string,
  ): Promise<QualityMonitoringRecord> {
    this.logger.log(`Recording quality metric for user: ${userId}, type: ${metricType}`);

    const record = await this.prisma.qualityMonitoringRecord.create({
      data: {
        userId,
        metricType,
        value,
        dateRecorded: new Date(),
        reviewerId,
        notes,
      },
    });

    // Update user's trust score based on the new metric
    await this.updatePractitionerTrustScore(userId);

    this.logger.log(`Quality metric recorded with ID: ${record.id}`);

    return record;
  }

  /**
   * Update practitioner's trust score based on quality metrics
   */
  private async updatePractitionerTrustScore(userId: string): Promise<void> {
    // Get recent quality metrics for the user
    const recentMetrics = await this.prisma.qualityMonitoringRecord.findMany({
      where: { userId },
      orderBy: { dateRecorded: 'desc' },
      take: 10, // Look at last 10 metrics
    });

    // Calculate average score from recent metrics
    const averageScore = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, metric) => sum + metric.value, 0) / recentMetrics.length
      : 0;

    // Calculate trust score based on metrics (scale 0-100)
    let trustScore = averageScore;

    // Adjust based on consistency and recency
    if (recentMetrics.length > 5) {
      // More metrics increase confidence in score
      trustScore += 5;
    }

    // Ensure score is within bounds
    trustScore = Math.max(0, Math.min(100, trustScore));

    // Update user's trust score
    await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: Math.round(trustScore) },
    });

    this.logger.log(`Updated trust score for user ${userId}: ${Math.round(trustScore)}`);
  }

  /**
   * Get practitioner's onboarding progress
   */
  async getOnboardingProgress(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingStatus: true,
        trustScore: true,
        isEmailVerified: true,
        passedCulturalOrientation: true,
      },
    });

    const verificationApplication = await this.prisma.verificationApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const skillAssessments = await this.prisma.skillAssessment.findMany({
      where: { userId },
    });

    const completedAssessments = skillAssessments.filter(ass => ass.status !== 'PENDING_REVIEW');
    const passedAssessments = skillAssessments.filter(ass => ass.status === 'PASSED');

    return {
      onboardingStatus: user.onboardingStatus,
      emailVerified: user.isEmailVerified,
      culturalOrientationPassed: user.passedCulturalOrientation,
      verificationApplication: verificationApplication ? {
        id: verificationApplication.id,
        status: verificationApplication.status,
        currentStage: verificationApplication.currentStage,
      } : null,
      skillAssessments: {
        total: skillAssessments.length,
        completed: completedAssessments.length,
        passed: passedAssessments.length,
        details: skillAssessments.map(ass => ({
          id: ass.id,
          type: ass.assessmentType,
          status: ass.status,
          score: ass.score,
          maxScore: ass.maxScore,
          specialization: ass.specialization,
        })),
      },
      trustScore: user.trustScore,
    };
  }

  /**
   * Get practitioner's quality monitoring history
   */
  async getQualityMonitoringHistory(userId: string): Promise<QualityMonitoringRecord[]> {
    return this.prisma.qualityMonitoringRecord.findMany({
      where: { userId },
      orderBy: { dateRecorded: 'desc' },
      take: 20, // Last 20 records
    });
  }
}