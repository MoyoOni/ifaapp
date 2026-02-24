import { Controller, Post, Get, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';
import { CertificateService } from './certificate.service';

@ApiTags('certificates')
@Controller('certificates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post('generate/:enrollmentId')
  @Roles(UserRole.ADMIN, UserRole.BABALAWO)
  @ApiOperation({ summary: 'Generate certificate for completed enrollment' })
  @ApiResponse({
    status: 200,
    description: 'Certificate generated successfully',
    schema: {
      type: 'object',
      properties: {
        certificateId: { type: 'string' },
        url: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async generateCertificate(@Param('enrollmentId') enrollmentId: string) {
    const result = await this.certificateService.generateCertificate(enrollmentId);

    return {
      ...result,
      message: 'Certificate generated successfully',
    };
  }

  @Post('bulk-generate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate certificates for all completed enrollments' })
  @ApiResponse({
    status: 200,
    description: 'Bulk certificate generation results',
    schema: {
      type: 'object',
      properties: {
        totalProcessed: { type: 'number' },
        generated: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              certificateId: { type: 'string' },
              url: { type: 'string' },
            },
          },
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              enrollmentId: { type: 'string' },
              student: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkGenerateCertificates(@Query('courseId') courseId?: string) {
    return this.certificateService.generateBulkCertificates(courseId);
  }

  @Get('enrollment/:enrollmentId')
  @Roles(UserRole.ADMIN, UserRole.BABALAWO, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get certificate by enrollment ID' })
  @ApiResponse({
    status: 200,
    description: 'Certificate details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        certificateUrl: { type: 'string' },
        issuedAt: { type: 'string', format: 'date-time' },
        enrollment: {
          type: 'object',
          properties: {
            course: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                instructor: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
              },
            },
            student: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async getCertificateByEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.certificateService.getCertificateByEnrollment(enrollmentId);
  }

  @Post('revoke/:certificateId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revoke certificate' })
  @ApiResponse({
    status: 200,
    description: 'Certificate revoked successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  async revokeCertificate(@Param('certificateId') certificateId: string) {
    await this.certificateService.revokeCertificate(certificateId);

    return {
      message: 'Certificate revoked successfully',
    };
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get certificate generation statistics' })
  @ApiResponse({
    status: 200,
    description: 'Certificate statistics',
    schema: {
      type: 'object',
      properties: {
        totalCertificates: { type: 'number' },
        certificatesThisMonth: { type: 'number' },
        pendingGeneration: { type: 'number' },
        pdfKitInstalled: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async getCertificateStats() {
    // Get statistics from database
    const totalCertificates = await this.certificateService['prisma'].courseCertificate.count();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const certificatesThisMonth = await this.certificateService['prisma'].courseCertificate.count({
      where: {
        issuedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Count completed enrollments without certificates
    const pendingGeneration = await this.certificateService['prisma'].enrollment.count({
      where: {
        status: 'COMPLETED',
        certificate: null,
      },
    });

    return {
      totalCertificates,
      certificatesThisMonth,
      pendingGeneration,
      pdfKitInstalled: false, // Will be true when pdfkit is available
      message: 'Certificate service operational',
    };
  }
}
