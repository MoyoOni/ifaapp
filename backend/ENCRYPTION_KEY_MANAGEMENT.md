# Encryption Key Management Guide

## Overview
This guide covers the implementation and management of encryption keys for secure messaging in the Ìlú Àṣẹ platform.

## Current Implementation

### Environment Variables
The system uses the `ENCRYPTION_KEY` environment variable for AES-256-GCM encryption of messages.

### Requirements
- **Length**: Exactly 32 characters
- **Format**: Hexadecimal string (generated via `crypto.randomBytes(16).toString('hex')`)
- **Environment**: Required in production, optional in development

## New Features Implemented

### 1. Enhanced Validation
- **Production**: ENCRYPTION_KEY is now mandatory
- **Development**: Falls back to default key for testing
- **Security Checks**: Validates key strength and patterns

### 2. Key Health Monitoring
API endpoints to monitor encryption key status:
- `/api/encryption/health` - Get key health report
- `/api/encryption/generate-key` - Generate secure key
- `/api/encryption/validate-key` - Validate existing key

### 3. Improved Error Handling
- Clear error messages for missing/invalid keys
- Environment-specific validation rules
- Security recommendations

## Usage Examples

### Generate a Secure Key
```bash
# Generate a new 32-character encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Set Environment Variable
```bash
# Linux/Mac
export ENCRYPTION_KEY="your-32-character-hex-key-here"

# Windows PowerShell
$env:ENCRYPTION_KEY="your-32-character-hex-key-here"

# Windows Command Prompt
set ENCRYPTION_KEY=your-32-character-hex-key-here
```

### Check Key Health (API)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/encryption/health
```

## Security Best Practices

### 1. Key Generation
```javascript
// Generate cryptographically secure key
const crypto = require('crypto');
const key = crypto.randomBytes(16).toString('hex');
console.log(key); // 32 character hex string
```

### 2. Key Storage
- Store in environment variables, never in code
- Use secret management tools in production
- Rotate keys periodically
- Never commit keys to version control

### 3. Key Validation
The system validates keys for:
- Correct length (32 characters)
- Character variety (mix of letters and numbers)
- No predictable patterns
- Not common test words

### 4. Production Requirements
In production environment (`NODE_ENV=production`):
- ENCRYPTION_KEY must be set
- Key must pass all security validations
- Application will fail to start with invalid key

## API Endpoints

### GET /api/encryption/health
Returns encryption key health status:
```json
{
  "isInitialized": true,
  "isValid": true,
  "isProductionReady": true,
  "errors": [],
  "environment": "production",
  "recommendations": ["✅ Encryption key is properly configured for production"]
}
```

### GET /api/encryption/generate-key
Generates a new secure encryption key:
```json
{
  "key": "a1b2c3d4e5f67890123456789abcdef0",
  "length": 32,
  "message": "Store this key securely in your ENCRYPTION_KEY environment variable"
}
```

### GET /api/encryption/validate-key
Validates the current encryption key:
```json
{
  "isValid": true,
  "errors": []
}
```

## Migration Guide

### From Development to Production
1. Generate a secure key using the method above
2. Set `ENCRYPTION_KEY` in production environment
3. Set `NODE_ENV=production`
4. Restart the application
5. Verify key health via API endpoint

### Key Rotation Process
1. Generate new encryption key
2. Update environment variable
3. Restart application
4. Old encrypted data remains accessible (keys are used for new encryption)
5. Consider re-encrypting sensitive data with new key

## Troubleshooting

### Common Issues

**Error: "ENCRYPTION_KEY is REQUIRED in production"**
- Solution: Set the ENCRYPTION_KEY environment variable

**Error: "ENCRYPTION_KEY must be exactly 32 characters"**
- Solution: Generate a proper 32-character hex key

**Error: "Encryption service not properly initialized"**
- Solution: Check that the service started correctly and key is valid

### Debugging Steps
1. Check environment variables: `console.log(process.env.ENCRYPTION_KEY)`
2. Verify key length: `process.env.ENCRYPTION_KEY?.length`
3. Test key validity: Use the validation API endpoint
4. Check application logs for initialization errors

## Future Enhancements

### Planned Features
- [ ] Automatic key rotation
- [ ] Key versioning support
- [ ] Hardware security module (HSM) integration
- [ ] Key backup and recovery mechanisms
- [ ] Audit logging for key operations

### Security Improvements
- [ ] Multi-factor key derivation
- [ ] Key escrow for disaster recovery
- [ ] Enhanced key strength requirements
- [ ] Integration with cloud KMS services