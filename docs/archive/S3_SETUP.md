# Ìlú Àṣẹ Documents Portal

This guide explains how to set up AWS S3 for the Ìlú Àṣẹ Documents Portal.

## Prerequisites

- AWS Account
- AWS CLI installed and configured (optional, for manual setup)
- Access to AWS Console

## Step 1: Create S3 Bucket

1. Log in to AWS Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Configure bucket:
   - **Bucket name**: `ile-ase-documents` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `us-east-1`, `eu-west-1`, `af-south-1`)
   - **Block Public Access**: ✅ Enable (all blocks checked)
   - **Bucket Versioning**: Optional (recommended for production)
   - **Default encryption**: ✅ Enable (SSE-S3 or SSE-KMS)
   - **Object Lock**: Optional (for compliance)

## Step 2: Create IAM User for S3 Access

1. Navigate to IAM Console
2. Click "Users" → "Add users"
3. Create user with programmatic access
4. Attach policy (create custom policy):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::ile-ase-documents/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::ile-ase-documents"
    }
  ]
}
```

5. Save Access Key ID and Secret Access Key

## Step 3: Configure Environment Variables

Add to your `.env` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=ile-ase-documents
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Virus Scanning (optional)
ENABLE_VIRUS_SCAN=true
```2

## Step 4: Bucket Policy (Optional)

For additional security, add bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::ile-ase-documents",
        "arn:aws:s3:::ile-ase-documents/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

## Step 5: Lifecycle Policy (Optional)

To manage storage costs, set up lifecycle rules:

1. Navigate to bucket → Management → Lifecycle rules
2. Create rule:
   - **Name**: `DeleteOldDocuments`
   - **Scope**: All objects
   - **Actions**: 
     - Transition to Glacier after 90 days
     - Delete after 365 days (or as per retention policy)

## Step 6: CloudWatch Monitoring (Optional)

Set up CloudWatch alarms for:
- Bucket size
- Number of objects
- Request metrics

## Security Best Practices

1. ✅ **Enable encryption at rest** (SSE-S3 or SSE-KMS)
2. ✅ **Block all public access**
3. ✅ **Use IAM roles** instead of access keys when possible (for EC2/ECS)
4. ✅ **Rotate access keys** regularly
5. ✅ **Enable MFA** for AWS account
6. ✅ **Use bucket policies** for additional access control
7. ✅ **Enable versioning** for critical documents
8. ✅ **Enable logging** (S3 access logs)

## Testing

After setup, test the integration:

1. Start the backend server
2. Upload a test document via API
3. Verify file appears in S3 bucket
4. Test signed URL generation
5. Verify file download works

## Troubleshooting

### Error: "Access Denied"
- Check IAM user permissions
- Verify bucket name matches environment variable
- Check bucket policy doesn't block access

### Error: "Bucket not found"
- Verify bucket name in environment variable
- Check region matches
- Ensure bucket exists in correct AWS account

### Error: "Invalid credentials"
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- Check credentials haven't expired
- Ensure IAM user has correct permissions

## Production Considerations

1. **Use AWS KMS** for encryption keys (instead of SSE-S3)
2. **Set up CloudTrail** for audit logging
3. **Configure CORS** if needed for direct browser uploads
4. **Set up replication** for disaster recovery
5. **Monitor costs** with AWS Cost Explorer
6. **Set up alerts** for unusual activity

## Virus Scanning Integration

The current implementation includes basic file validation. For production, consider:

1. **AWS GuardDuty** - Automated threat detection
2. **ClamAV** - Self-hosted virus scanner
3. **VirusTotal API** - Third-party scanning service
4. **AWS Lambda** - Serverless scanning function

To integrate a full virus scanning solution, update `virus-scan.service.ts` with the appropriate service integration.
