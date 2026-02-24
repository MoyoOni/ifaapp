# S3 Integration Testing Guide

This guide will help you test the document upload/download functionality with S3.

## Prerequisites

Before testing, ensure you've completed the [S3_SETUP_GUIDE.md](./S3_SETUP_GUIDE.md):
- ✅ AWS S3 bucket created
- ✅ IAM user with S3 permissions created
- ✅ AWS credentials added to `backend/.env`
- ✅ CORS configured on the S3 bucket

## Quick Start Test

### 1. Start the Backend

```bash
cd backend
npm run dev
```

The server should start on `http://localhost:3000` and log:
```
S3 Service initialized for bucket: ile-ase-documents-dev in region: us-east-1
Virus scanning disabled - skipping scan
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The app should start on `http://localhost:5173`

### 3. Create Test Users

You'll need:
- A **Babalawo** account (can upload documents)
- A **Client** account (receives documents)

Use the quick access feature or register new users.

### 4. Create a Babalawo-Client Relationship

**Important**: Documents can only be shared between Babalawos and their assigned clients.

1. Log in as an Admin or use the API to create a relationship:

```bash
curl -X POST http://localhost:3000/api/babalawo-client \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "babalawoId": "babalawo-user-id",
    "clientId": "client-user-id",
    "relationshipType": "PERSONAL_AWO",
    "duration": 6,
    "covenantAgreement": "Test covenant"
  }'
```

### 5. Test Document Upload

1. **Log in as the Babalawo**
2. Navigate to **Documents Portal**
3. Click **"Upload Document"** button
4. Fill in the form:
   - **Select File**: Choose a test file (PDF, image, etc.)
   - **Share With Client**: Select your test client from dropdown
   - **Document Type**: Auto-detected or manually select
   - **Description**: Add optional description
5. Click **"Upload"**

**Expected Results**:
- ✅ Loading spinner appears
- ✅ File is uploaded to S3
- ✅ Success message or redirect
- ✅ Document appears in the list

### 6. Test Document Download

1. **Still logged in as Babalawo** (or log in as the Client)
2. In the Documents Portal, find your uploaded document
3. Click **"Download"** button

**Expected Results**:
- ✅ Signed URL is generated
- ✅ File downloads/opens in new tab
- ✅ File content is correct

### 7. Verify in S3 Console

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Open your bucket (`ile-ase-documents-dev`)
3. Navigate to `documents/{babalawo-id}/`
4. You should see your uploaded file with format: `{timestamp}-{random}-{filename}`

### 8. Test Document Deletion

1. **Log in as the Babalawo** (uploader)
2. Click the **trash icon** on a document
3. Confirm deletion

**Expected Results**:
- ✅ Document removed from database
- ✅ Document removed from S3
- ✅ Document disappears from UI

## Advanced Testing

### Test File Size Validation

**Test Case**: Upload a file > 50MB

**Expected Result**:
- ❌ Frontend blocks upload with error: "File size must be less than 50MB"

### Test Access Control

**Test Case 1**: Client tries to upload document
- ❌ Should fail (only Babalawos can upload)

**Test Case 2**: Babalawo tries to share with non-client
- ❌ Should fail: "You can only share documents with your assigned clients"

**Test Case 3**: User tries to download another user's document
- ❌ Should fail: "You do not have access to this document"

### Test Different File Types

Test uploading various file types:
- ✅ PDF documents
- ✅ Word documents (.docx)
- ✅ Images (PNG, JPG, JPEG, GIF)
- ✅ Audio files (MP3, WAV, M4A)
- ✅ Video files (MP4, MOV)

### Test Virus Scanning (when enabled)

1. Update `backend/.env`:
   ```env
   ENABLE_VIRUS_SCAN=true
   ```

2. Restart backend server

3. Upload a file

**Current Behavior** (basic validation):
- ✅ Files < 50MB pass
- ⚠️ Files with suspicious extensions (.exe, .bat, etc.) are logged but not blocked
- ❌ Files > 50MB are rejected

**Note**: Actual virus scanning requires integration with ClamAV, AWS GuardDuty, or similar service.

### Test Signed URL Expiration

1. Download a document to get signed URL
2. Copy the signed URL from browser/network tab
3. Wait 1 hour (or modify code to use shorter expiration for testing)
4. Try to access the URL again

**Expected Result**:
- ❌ After expiration: "Access Denied" or "Request has expired"

### Test Edge Cases

**Empty File**:
- Upload a 0-byte file
- Should upload successfully (no minimum size)

**Special Characters in Filename**:
- Upload file with spaces: `my document.pdf`
- Upload file with unicode: `documento-español.pdf`
- Should sanitize filename in S3 key

**Concurrent Uploads**:
- Upload multiple files simultaneously
- All should succeed

## API Testing (via cURL/Postman)

### Upload Document

```bash
curl -X POST http://localhost:3000/api/documents/upload/{babalawoId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "filename=test-document.pdf" \
  -F "type=document" \
  -F "sharedWith={clientId}" \
  -F "mimeType=application/pdf" \
  -F "description=Test document upload"
```

### Get User Documents

```bash
curl -X GET http://localhost:3000/api/documents/user/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Signed URL

```bash
curl -X GET http://localhost:3000/api/documents/{documentId}/signed-url/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "signedUrl": "https://ile-ase-documents-dev.s3.amazonaws.com/documents/...",
  "expiresAt": "2026-01-25T15:30:00.000Z"
}
```

### Delete Document

```bash
curl -X DELETE http://localhost:3000/api/documents/{documentId}/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Error: "Failed to upload file to storage"

**Possible Causes**:
1. Invalid AWS credentials
2. Bucket doesn't exist
3. IAM permissions insufficient
4. Network connectivity issues

**Solutions**:
- Verify credentials in `.env`
- Check bucket exists in AWS Console
- Review IAM policy permissions
- Check AWS service status

### Error: "Access Denied" when downloading

**Possible Causes**:
1. User doesn't have permission to access document
2. Document doesn't exist
3. S3 bucket permissions issue

**Solutions**:
- Verify user is uploader or recipient
- Check document exists in database
- Review S3 bucket policies

### File uploads but doesn't appear in S3

**Possible Causes**:
1. Wrong bucket name in environment
2. Wrong region
3. S3 client not initialized properly

**Solutions**:
- Double-check `AWS_S3_BUCKET_NAME` in `.env`
- Verify `AWS_REGION` matches bucket region
- Check backend logs for S3 errors

### Signed URL returns "Request has expired"

**Cause**: URL has expired (default 1 hour)

**Solution**: Generate new signed URL

## Performance Testing

### Test Upload Speed

Upload files of various sizes and measure time:
- 1 MB file: ~1-3 seconds
- 10 MB file: ~3-10 seconds
- 50 MB file: ~10-30 seconds

**Note**: Speed depends on internet connection and AWS region proximity.

### Test with Multiple Users

Simulate multiple concurrent uploads:
1. Create 5+ Babalawo-Client pairs
2. Upload documents simultaneously
3. Verify all uploads succeed

## Security Checklist

Before production:
- [ ] S3 bucket has **Block Public Access** enabled
- [ ] IAM user uses **least privilege** policy
- [ ] **CORS** only allows your production domain
- [ ] **Encryption at rest** enabled (SSE-S3 or SSE-KMS)
- [ ] **Bucket versioning** enabled
- [ ] **Access logging** configured
- [ ] **Virus scanning** integrated (not just basic validation)
- [ ] **Rate limiting** on upload endpoints
- [ ] **File type validation** on backend
- [ ] **AWS credentials** NOT committed to git
- [ ] Different buckets for dev/staging/prod

## Monitoring

### CloudWatch Metrics to Monitor

1. **S3 Metrics**:
   - `NumberOfObjects` - Track storage growth
   - `BucketSizeBytes` - Monitor storage costs
   - `4xxErrors` - Access denied errors
   - `5xxErrors` - Server errors

2. **Application Metrics**:
   - Upload success rate
   - Average upload time
   - Failed uploads per day
   - Signed URL generation rate

### Set Up Alerts

Create CloudWatch alarms for:
- Storage exceeds expected threshold
- High error rates (>5% failures)
- Unusual upload patterns (potential abuse)

## Next Steps

After successful testing:
1. ✅ Document upload/download works
2. ✅ Access control enforced
3. ✅ Files stored securely in S3
4. ⚠️ Integrate actual virus scanning service
5. ⚠️ Set up CloudFront CDN for faster downloads (optional)
6. ⚠️ Implement file compression for large uploads (optional)
7. ⚠️ Add upload progress indicators (optional)

## Support

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- NestJS File Upload: https://docs.nestjs.com/techniques/file-upload
- AWS SDK v3 for JavaScript: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/
