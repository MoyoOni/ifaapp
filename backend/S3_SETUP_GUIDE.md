# AWS S3 Setup Guide for Ìlú Àṣẹ Documents

This guide will help you set up AWS S3 for document storage in the Ìlú Àṣẹ application.

## Prerequisites

- AWS Account (create one at [aws.amazon.com](https://aws.amazon.com))
- AWS CLI installed (optional but recommended)

## Step 1: Create an S3 Bucket

### Option A: Using AWS Console

1. **Log in to AWS Console**: Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)

2. **Create Bucket**:
   - Click "Create bucket"
   - **Bucket name**: `ile-ase-documents-dev` (for development) or `ile-ase-documents-prod` (for production)
   - **AWS Region**: Select `us-east-1` (or your preferred region)
   - **Block Public Access**: Keep ALL public access blocked (IMPORTANT for security)
   - **Bucket Versioning**: Enable (recommended for document recovery)
   - **Default encryption**: Enable with SSE-S3 (Server-Side Encryption)
   - Click "Create bucket"

### Option B: Using AWS CLI

```bash
# Create bucket
aws s3api create-bucket \
  --bucket ile-ase-documents-dev \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ile-ase-documents-dev \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket ile-ase-documents-dev \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access (CRITICAL for security)
aws s3api put-public-access-block \
  --bucket ile-ase-documents-dev \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

## Step 2: Configure CORS (for Frontend Uploads)

Add CORS policy to allow frontend to upload files:

1. Go to your bucket → **Permissions** → **CORS**
2. Add the following configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:5173", "https://your-production-domain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Step 3: Create IAM User with S3 Access

### Using AWS Console

1. **Go to IAM Console**: [IAM Users](https://console.aws.amazon.com/iam/home#/users)

2. **Create User**:
   - Click "Add users"
   - **User name**: `ile-ase-s3-user`
   - **Access type**: Select "Programmatic access"
   - Click "Next: Permissions"

3. **Set Permissions**:
   - Click "Attach policies directly"
   - Create a custom policy (recommended for security):
     - Click "Create policy"
     - Select JSON tab
     - Paste the policy below
     - Name it `IleAseS3Policy`
     - Click "Create policy"
   - Attach the `IleAseS3Policy` to your user
   - Click "Next" → "Create user"

4. **Save Credentials**:
   - **IMPORTANT**: Download the CSV or copy the Access Key ID and Secret Access Key
   - You won't be able to see the secret key again!

### Recommended IAM Policy (Least Privilege)

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
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ile-ase-documents-dev",
        "arn:aws:s3:::ile-ase-documents-dev/*"
      ]
    }
  ]
}
```

## Step 4: Update Backend Environment Variables

Update your `backend/.env` file with the credentials:

```env
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=ile-ase-documents-dev
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-access-key
ENABLE_VIRUS_SCAN=false
```

**IMPORTANT**:
- Never commit `.env` files to git
- Use different buckets for dev/staging/production
- Rotate access keys regularly

## Step 5: Test the Integration

### Test Upload via API

```bash
# Start your backend server
cd backend
npm run dev

# Test upload (requires authentication)
curl -X POST http://localhost:3000/api/documents/upload/:uploadedBy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/test-document.pdf" \
  -F "filename=test-document.pdf" \
  -F "type=document" \
  -F "sharedWith=CLIENT_USER_ID"
```

### Verify Upload in S3

1. Go to S3 Console → Your bucket
2. Navigate to `documents/:uploadedBy/`
3. You should see your uploaded file

### Test Download

```bash
# Get signed URL
curl -X GET http://localhost:3000/api/documents/:documentId/signed-url/:userId \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# The response will include a temporary signed URL valid for 1 hour
# Open this URL in your browser to download the file
```

## Security Best Practices

### 1. Bucket Security
- ✅ Block ALL public access (already done)
- ✅ Enable versioning for recovery
- ✅ Enable encryption at rest (SSE-S3 or SSE-KMS)
- ✅ Enable access logging
- ✅ Use bucket policies to restrict access

### 2. IAM Security
- ✅ Use least privilege policies (only required S3 actions)
- ✅ Rotate access keys every 90 days
- ✅ Never hardcode credentials in code
- ✅ Use IAM roles instead of keys when running on AWS (EC2, Lambda, ECS)

### 3. Application Security
- ✅ Validate file types before upload
- ✅ Scan files for viruses (implement virus scanning service)
- ✅ Limit file sizes (currently 50MB max)
- ✅ Use signed URLs with short expiration (1 hour)
- ✅ Verify user permissions before generating signed URLs

### 4. Enable S3 Access Logging (Recommended)

```bash
# Create logging bucket
aws s3api create-bucket \
  --bucket ile-ase-documents-logs \
  --region us-east-1

# Enable logging
aws s3api put-bucket-logging \
  --bucket ile-ase-documents-dev \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "ile-ase-documents-logs",
      "TargetPrefix": "ile-ase-dev/"
    }
  }'
```

## Production Considerations

### 1. Multiple Environments

Use separate buckets for each environment:
- `ile-ase-documents-dev` (development)
- `ile-ase-documents-staging` (staging)
- `ile-ase-documents-prod` (production)

### 2. Lifecycle Policies

Configure automatic deletion of old/unused files:

```json
{
  "Rules": [
    {
      "Id": "DeleteOldTempFiles",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "TransitionToGlacier",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### 3. CloudFront CDN (Optional)

For faster downloads globally, set up CloudFront:
- Create CloudFront distribution with S3 as origin
- Enable Origin Access Identity (OAI)
- Update signed URL generation to use CloudFront URLs

### 4. Virus Scanning Integration

Implement one of these options:
- **AWS GuardDuty**: Automatically scan S3 uploads
- **ClamAV**: Self-hosted open-source antivirus
- **Third-party**: VirusTotal API, MetaDefender Cloud

Update `backend/src/documents/virus-scan.service.ts` with your chosen solution.

## Troubleshooting

### "Access Denied" Error
- Check IAM policy permissions
- Verify bucket name matches environment variable
- Ensure credentials are correct

### "Bucket Not Found" Error
- Verify bucket exists in the specified region
- Check bucket name spelling
- Ensure region matches in .env

### Upload Fails
- Check file size (max 50MB)
- Verify CORS configuration
- Check network connectivity to AWS

### Signed URL Expired
- Signed URLs expire after 1 hour by default
- Generate new signed URL if expired
- Adjust expiration in code if needed

## Cost Estimation

AWS S3 pricing (as of 2026):
- **Storage**: ~$0.023 per GB/month (Standard)
- **Requests**: ~$0.005 per 1,000 PUT requests
- **Data Transfer**: Free for uploads, $0.09/GB for downloads (after 1GB free tier)

Example for 1,000 active users:
- 10 documents per user = 10,000 documents
- Average 2MB per document = 20GB storage
- Cost: ~$0.46/month for storage + minimal request costs

## Support

For AWS-specific issues:
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS Support](https://aws.amazon.com/support/)

For Ilé Àṣẹ application issues:
- Check application logs
- Review [backend/src/documents/](backend/src/documents/) service code
- File an issue in the project repository
