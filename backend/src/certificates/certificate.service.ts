import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../documents/s3.service';
// import * as PDFDocument from 'pdfkit'; // Will be enabled when pdfkit is installed
import * as fs from 'fs';
import * as path from 'path';

/**
 * Certificate Generation Service
 * Generates course completion certificates in PDF format
 * Currently provides framework - full implementation will be enabled when pdfkit is available
 */
@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);
  private readonly tempDir: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private s3Service: S3Service
  ) {
    this.tempDir = this.configService.get<string>('TEMP_DIR') || '/tmp';

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    this.logger.log('Certificate service initialized');
  }

  /**
   * Generate course completion certificate
   * Currently returns placeholder - full implementation will be enabled when pdfkit is installed
   */
  async generateCertificate(enrollmentId: string): Promise<CertificateResult> {
    try {
      // Fetch enrollment with course and student details
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  id: true,
                  name: true,
                  yorubaName: true,
                  verified: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          certificate: true,
        },
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      if (enrollment.status !== 'COMPLETED') {
        throw new Error('Course not completed yet');
      }

      // Check if certificate already exists
      if (enrollment.certificate) {
        return {
          certificateId: enrollment.certificate.id,
          url: enrollment.certificate.certificateUrl,
          // filename: enrollment.certificate.filename, // Field doesn't exist in schema
        };
      }

      // Generate certificate data (placeholder implementation)
      const certificateData = this.createCertificateData(enrollment);

      // Generate filename
      const filename = this.generateCertificateFilename(enrollment);

      // Create mock PDF buffer (will be replaced with real PDF generation)
      const pdfBuffer = this.createMockPdfBuffer(certificateData);

      // Upload to S3
      const s3Key = `certificates/${filename}`;
      await this.s3Service.uploadFile(pdfBuffer, s3Key, 'application/pdf');

      // Generate signed URL (valid for 1 year)
      const signedUrl = await this.s3Service.getSignedUrl(s3Key, 31536000); // 1 year

      // Save certificate record
      const certificate = await this.prisma.courseCertificate.create({
        data: {
          enrollmentId: enrollment.id,
          certificateUrl: signedUrl,
          // filename, // Field doesn't exist in schema
          issuedAt: new Date(),
        },
      });

      this.logger.log(`Certificate generated for enrollment ${enrollmentId}`, {
        student: enrollment.student.name,
        course: enrollment.course.title,
        certificateId: certificate.id,
      });

      return {
        certificateId: certificate.id,
        url: signedUrl,
        // filename, // Field doesn't exist in schema
      };
    } catch (error) {
      this.logger.error(`Failed to generate certificate for enrollment ${enrollmentId}:`, error);
      throw new Error(`Certificate generation failed: ${error}`);
    }
  }

  /**
   * Bulk generate certificates for completed courses
   */
  async generateBulkCertificates(courseId?: string): Promise<BulkCertificateResult> {
    try {
      // Find completed enrollments without certificates
      const where: any = {
        status: 'COMPLETED',
        certificate: null,
      };

      if (courseId) {
        where.courseId = courseId;
      }

      const enrollments = await this.prisma.enrollment.findMany({
        where,
        include: {
          course: {
            include: {
              instructor: {
                select: { name: true, yorubaName: true },
              },
            },
          },
          student: {
            select: { name: true, email: true },
          },
        },
      });

      const results: CertificateResult[] = [];
      const errors: CertificateError[] = [];

      // Generate certificates (currently synchronous since it's placeholder)
      for (const enrollment of enrollments) {
        try {
          const result = await this.generateCertificate(enrollment.id);
          results.push(result);
        } catch (error) {
          errors.push({
            enrollmentId: enrollment.id,
            student: enrollment.student.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      this.logger.log(`Bulk certificate generation completed`, {
        total: enrollments.length,
        generated: results.length,
        failed: errors.length,
      });

      return {
        totalProcessed: enrollments.length,
        generated: results.length,
        failed: errors.length,
        results,
        errors,
      };
    } catch (error) {
      this.logger.error('Bulk certificate generation failed:', error);
      throw new Error(`Bulk certificate generation failed: ${error}`);
    }
  }

  /**
   * Get certificate by enrollment ID
   */
  async getCertificateByEnrollment(enrollmentId: string) {
    return this.prisma.courseCertificate.findUnique({
      where: { enrollmentId },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                title: true,
                instructor: {
                  select: { name: true, yorubaName: true },
                },
              },
            },
            student: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(certificateId: string): Promise<void> {
    const certificate = await this.prisma.courseCertificate.findUnique({
      where: { id: certificateId },
      include: { enrollment: true },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    // Delete from S3
    try {
      // const s3Key = `certificates/${certificate.filename}`; // Field doesn't exist
      const s3Key = `certificates/mock-${certificate.id}.pdf`;
      await this.s3Service.deleteFile(s3Key);
    } catch (error) {
      this.logger.warn(`Failed to delete certificate from S3: ${error}`);
    }

    // Delete from database
    await this.prisma.courseCertificate.delete({
      where: { id: certificateId },
    });

    // Reset enrollment status
    await this.prisma.enrollment.update({
      where: { id: certificate.enrollmentId },
      data: { status: 'ACTIVE' },
    });

    this.logger.log(`Certificate revoked: ${certificateId}`);
  }

  /**
   * Create certificate data object
   */
  private createCertificateData(enrollment: any): CertificateData {
    return {
      studentName: enrollment.student.name,
      courseTitle: enrollment.course.title,
      instructorName: enrollment.course.instructor.name,
      completionDate: enrollment.completedAt || new Date(),
      enrollmentId: enrollment.id,
    };
  }

  /**
   * Create mock PDF buffer (placeholder implementation)
   */
  private createMockPdfBuffer(data: CertificateData): Buffer {
    // In a real implementation, this would generate an actual PDF
    // For now, we create a simple text representation

    const content = `
CERTIFICATE OF COMPLETION

This certifies that ${data.studentName}
has successfully completed the course "${data.courseTitle}"
taught by ${data.instructorName}

Completed on: ${data.completionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}

Certificate ID: ${data.enrollmentId.substring(0, 8).toUpperCase()}

Issued by Ìlú Àṣẹ Spiritual Academy
    `.trim();

    return Buffer.from(content, 'utf-8');
  }

  /**
   * Generate certificate filename
   */
  private generateCertificateFilename(enrollment: any): string {
    const studentName = enrollment.student.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    const courseTitle = enrollment.course.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    const timestamp = Date.now();

    return `${studentName}_${courseTitle}_${timestamp}.pdf`;
  }
}

// Interfaces
export interface CertificateResult {
  certificateId: string;
  url: string;
  // filename: string; // Field doesn't exist in schema
}

export interface BulkCertificateResult {
  totalProcessed: number;
  generated: number;
  failed: number;
  results: CertificateResult[];
  errors: CertificateError[];
}

export interface CertificateError {
  enrollmentId: string;
  student: string;
  error: string;
}

interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  enrollmentId: string;
}
