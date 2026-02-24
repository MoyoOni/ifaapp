# Certificate Generation Implementation Guide

## Overview
This guide covers the course completion certificate generation system for the Ìlú Àṣẹ platform, enabling automated PDF certificate creation for completed courses.

## Current Implementation

### Core Components
1. **CertificateService** - Certificate generation and management service
2. **CertificateController** - API endpoints for certificate operations
3. **CertificateModule** - NestJS module registration

### Features Implemented
- Automated certificate generation upon course completion
- Bulk certificate generation for multiple enrollments
- Certificate revocation capability
- S3 storage integration
- RESTful API endpoints
- Statistics and monitoring

## Installation and Setup

### 1. Install PDF Generation Dependencies
```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

### 2. Environment Configuration
Add to `.env`:
```bash
# Temporary directory for PDF generation
TEMP_DIR=/tmp/certificates

# S3 Configuration (already configured for documents)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=ile-ase-documents
```

### 3. Schema Updates
The Prisma schema already includes the `CourseCertificate` model:

```prisma
model CourseCertificate {
  id             String     @id @default(cuid())
  enrollmentId   String     @unique
  certificateUrl String
  issuedAt       DateTime   @default(now())
  enrollment     Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}
```

Run migration:
```bash
npx prisma migrate dev --name add_course_certificates
```

## Service Usage

### Generate Individual Certificate
```typescript
// In your service constructor
constructor(private certificateService: CertificateService) {}

// Generate certificate for completed enrollment
const certificate = await this.certificateService.generateCertificate(enrollmentId);

console.log('Certificate generated:', {
  certificateId: certificate.certificateId,
  downloadUrl: certificate.url
});
```

### Bulk Certificate Generation
```typescript
// Generate certificates for all completed enrollments
const bulkResult = await this.certificateService.generateBulkCertificates();

console.log('Bulk generation results:', {
  totalProcessed: bulkResult.totalProcessed,
  generated: bulkResult.generated,
  failed: bulkResult.failed
});

// Generate certificates for specific course
const courseResults = await this.certificateService.generateBulkCertificates(courseId);
```

### Get Certificate Details
```typescript
// Retrieve certificate by enrollment ID
const certificate = await this.certificateService.getCertificateByEnrollment(enrollmentId);

console.log('Certificate details:', {
  issuedAt: certificate.issuedAt,
  student: certificate.enrollment.student.name,
  course: certificate.enrollment.course.title,
  instructor: certificate.enrollment.course.instructor.name
});
```

### Revoke Certificate
```typescript
// Revoke a certificate (deletes from S3 and database)
await this.certificateService.revokeCertificate(certificateId);

// This also resets the enrollment status to ACTIVE
```

## API Endpoints

### POST /api/certificates/generate/:enrollmentId
Generate certificate for a specific enrollment:
```bash
curl -X POST http://localhost:3000/api/certificates/generate/enrollment-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "certificateId": "cert-456",
  "url": "https://s3.amazonaws.com/bucket/certificates/student_course_1234567890.pdf",
  "message": "Certificate generated successfully"
}
```

### POST /api/certificates/bulk-generate
Generate certificates for all completed enrollments:
```bash
curl -X POST "http://localhost:3000/api/certificates/bulk-generate?courseId=course-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "totalProcessed": 25,
  "generated": 23,
  "failed": 2,
  "results": [
    {
      "certificateId": "cert-001",
      "url": "https://s3.amazonaws.com/bucket/certificates/student1_course_1234567890.pdf"
    }
  ],
  "errors": [
    {
      "enrollmentId": "enroll-001",
      "student": "John Doe",
      "error": "Student name contains invalid characters"
    }
  ]
}
```

### GET /api/certificates/enrollment/:enrollmentId
Get certificate details for an enrollment:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/certificates/enrollment/enrollment-123
```

Response:
```json
{
  "id": "cert-456",
  "certificateUrl": "https://s3.amazonaws.com/bucket/certificates/student_course_1234567890.pdf",
  "issuedAt": "2024-02-14T10:30:00.000Z",
  "enrollment": {
    "course": {
      "title": "Advanced Yoruba Spirituality",
      "instructor": {
        "name": "Chief Babalawo Adeyemi"
      }
    },
    "student": {
      "name": "Alice Johnson",
      "email": "alice@example.com"
    }
  }
}
```

### POST /api/certificates/revoke/:certificateId
Revoke a certificate:
```bash
curl -X POST http://localhost:3000/api/certificates/revoke/cert-456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "message": "Certificate revoked successfully"
}
```

### GET /api/certificates/stats
Get certificate generation statistics:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/certificates/stats
```

Response:
```json
{
  "totalCertificates": 150,
  "certificatesThisMonth": 25,
  "pendingGeneration": 8,
  "pdfKitInstalled": true,
  "message": "Certificate service operational"
}
```

## Integration Examples

### Automatic Certificate Generation on Course Completion
```typescript
// In AcademyService when enrollment status changes to COMPLETED
async updateEnrollment(
  enrollmentId: string,
  dto: UpdateEnrollmentDto,
  currentUser: CurrentUserPayload
) {
  // ... existing logic ...
  
  if (
    dto.status === EnrollmentStatus.COMPLETED &&
    enrollment.status !== EnrollmentStatus.COMPLETED
  ) {
    updateData.completedAt = new Date();
    
    // Generate certificate automatically if enabled
    if (enrollment.course.certificateEnabled) {
      try {
        const certificate = await this.certificateService.generateCertificate(enrollmentId);
        this.logger.log(`Certificate generated: ${certificate.certificateId}`);
      } catch (error) {
        this.logger.error('Failed to generate certificate:', error);
        // Don't fail the enrollment update if certificate generation fails
      }
    }
  }
  
  // ... rest of update logic ...
}
```

### Admin Dashboard Certificate Management
```typescript
// Get pending certificates for admin review
async getPendingCertificates() {
  return this.prisma.enrollment.findMany({
    where: {
      status: 'COMPLETED',
      certificate: null
    },
    include: {
      course: { select: { title: true } },
      student: { select: { name: true, email: true } }
    },
    orderBy: { completedAt: 'desc' }
  });
}

// Manual certificate generation for specific enrollment
async generateManualCertificate(enrollmentId: string) {
  const enrollment = await this.prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { 
      course: true, 
      student: true,
      certificate: true 
    }
  });
  
  if (!enrollment) {
    throw new NotFoundException('Enrollment not found');
  }
  
  if (enrollment.certificate) {
    return enrollment.certificate; // Already exists
  }
  
  return this.certificateService.generateCertificate(enrollmentId);
}
```

## Certificate Template Customization

### Current Template Features
- Professional certificate layout
- Student name and course title
- Instructor information
- Completion date
- Digital signatures placeholders
- QR code for verification
- Platform branding

### Customizing the Template
Modify the `createCertificatePDF` method in `CertificateService`:

```typescript
private async createCertificatePDF(enrollment: any): Promise<Buffer> {
  // Customize fonts, colors, layout
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    font: 'Helvetica' // or custom font
  });
  
  // Add custom elements
  doc.image('path/to/logo.png', 50, 50, { width: 100 });
  doc.fontSize(32).text('PREMIUM CERTIFICATE', 100, 100);
  
  // Add custom fields
  doc.fontSize(12).text(`CEU Credits: ${enrollment.course.ceuCredits || 0}`, 50, 700);
  
  // ... rest of template ...
}
```

## Security Considerations

### Access Control
- Only admins and instructors can generate certificates
- Students can only view their own certificates
- Certificate URLs are signed and time-limited (1 year by default)

### Data Validation
- Validate student names and course titles
- Sanitize input to prevent injection attacks
- Verify enrollment completion status

### Storage Security
- Certificates stored in private S3 bucket
- Signed URLs with expiration
- Regular backup of certificate records

## Performance Optimization

### Batch Processing
```typescript
// Process certificates in batches to avoid memory issues
const batchSize = 10;
for (let i = 0; i < enrollments.length; i += batchSize) {
  const batch = enrollments.slice(i, i + batchSize);
  await Promise.all(batch.map(enrollment => 
    this.certificateService.generateCertificate(enrollment.id)
  ));
}
```

### Caching Strategies
- Cache frequently accessed certificate templates
- Store generated certificates with appropriate TTL
- Use Redis for temporary storage during generation

## Monitoring and Analytics

### Key Metrics to Track
- Certificate generation rate
- Failed generation attempts
- Average generation time
- Storage usage
- Download statistics

### Logging
```typescript
this.logger.log('Certificate generated', {
  enrollmentId,
  studentId: enrollment.studentId,
  courseId: enrollment.courseId,
  generationTime: Date.now() - startTime
});
```

## Future Enhancements

### Planned Features
- [ ] Custom certificate templates per course
- [ ] Multi-language certificate support
- [ ] Digital signature integration
- [ ] Blockchain-based certificate verification
- [ ] Certificate sharing and social media integration
- [ ] Automated email delivery of certificates

### Advanced Features
- [ ] AI-powered certificate design
- [ ] Dynamic QR code with verification endpoint
- [ ] Certificate analytics dashboard
- [ ] Integration with external credential platforms
- [ ] Mobile-friendly certificate viewer

## Troubleshooting

### Common Issues

**PDF Generation Failures**
```bash
# Check pdfkit installation
npm list pdfkit

# Reinstall if needed
npm install pdfkit @types/pdfkit
```

**S3 Upload Errors**
- Verify AWS credentials
- Check bucket permissions
- Ensure proper IAM policies

**Font Issues**
- Install required system fonts
- Use embedded fonts in PDF
- Test with simple font families first

### Debugging Commands
```bash
# Test certificate generation manually
node test-certificate-generation.js

# Check S3 connectivity
aws s3 ls s3://your-bucket-name/certificates/

# Monitor certificate service logs
tail -f logs/certificate-service.log
```