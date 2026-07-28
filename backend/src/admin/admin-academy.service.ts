import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAcademyService {
  constructor(private prisma: PrismaService) {}

  async getAllCourses(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true, lessons: true } },
        },
      }),
      this.prisma.course.count(),
    ]);
    return { courses, total, page, pages: Math.ceil(total / limit) };
  }

  async featureCourse(courseId: string, featuredUntil: Date | null) {
    return this.prisma.course.update({
      where: { id: courseId },
      data: { isFeatured: !!featuredUntil, featuredUntil },
    });
  }

  async updateCourseStatus(courseId: string, status: string, adminId: string, reason?: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const data: Record<string, string | null> = { status };
    if (status === 'APPROVED') data.approvedBy = adminId;
    await this.prisma.course.update({ where: { id: courseId }, data });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'COURSE_STATUS_CHANGE',
        resourceType: 'Course',
        resourceId: courseId,
        newValues: { status, reason: reason ?? null },
      },
    });
    return { success: true, status };
  }

  async getEnrollmentStats() {
    const courses = await this.prisma.course.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        enrolledCount: true,
        _count: { select: { enrollments: true } },
        enrollments: { select: { status: true, completedAt: true } },
      },
      orderBy: { enrolledCount: 'desc' },
    });
    return courses.map((c) => {
      const completed = c.enrollments.filter((e) => e.completedAt).length;
      const total = c.enrollments.length;
      const price = Number(c.price);
      return {
        id: c.id,
        title: c.title,
        price,
        currency: c.currency,
        enrollments: total,
        completions: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        revenue: price * total,
      };
    });
  }

  async manualEnroll(courseId: string, userId: string) {
    const existing = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: userId } },
    });
    if (existing) return existing;
    const enrollment = await this.prisma.enrollment.create({
      data: { courseId, studentId: userId, status: 'ACTIVE' },
    });
    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrolledCount: { increment: 1 } },
    });
    return enrollment;
  }

  async removeEnrollment(courseId: string, userId: string) {
    await this.prisma.enrollment.deleteMany({ where: { courseId, studentId: userId } });
    return { success: true };
  }

  async issueCertificate(enrollmentId: string, adminId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    const existing = await this.prisma.courseCertificate.findUnique({ where: { enrollmentId } });
    if (existing && !existing.deletedAt) return existing;

    // ProBacklog-v1.md item #12 (soft-delete audit): enrollmentId is @unique
    // on CourseCertificate, so re-issuing after a revocation must reuse
    // (un-revoke) that same row rather than create a second one -- a plain
    // .create() here would hit the unique constraint.
    const cert = existing
      ? await this.prisma.courseCertificate.update({
          where: { enrollmentId },
          data: { certificateUrl: '', issuedAt: new Date(), deletedAt: null },
        })
      : await this.prisma.courseCertificate.create({
          data: { enrollmentId, certificateUrl: '' },
        });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CERTIFICATE_ISSUED',
        resourceType: 'Enrollment',
        resourceId: enrollmentId,
      },
    });
    return cert;
  }

  // ProBacklog-v1.md item #12 (soft-delete audit): an issued credential --
  // revoking it for cause is legitimate, but destroying the record entirely
  // loses provenance (unlike the AuditLog entry below, which is the only
  // trace that survived before this fix). Soft-deleted like the other 7
  // models in this pass; the "doesn't have a revokedAt field" workaround
  // this comment used to describe is now just deletedAt, matching the rest
  // of the codebase's convention instead of a bespoke field name.
  async revokeCertificate(enrollmentId: string, reason: string, adminId: string) {
    const cert = await this.prisma.courseCertificate.findUnique({
      where: { enrollmentId, deletedAt: null },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    await this.prisma.courseCertificate.update({
      where: { enrollmentId },
      data: { deletedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CERTIFICATE_REVOKED',
        resourceType: 'Enrollment',
        resourceId: enrollmentId,
        newValues: { reason },
      },
    });
    return { success: true };
  }
}
