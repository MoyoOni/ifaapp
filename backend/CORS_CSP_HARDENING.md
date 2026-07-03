# CORS/CSP Security Hardening Guide

## Overview
This guide covers the implementation of enhanced CORS and CSP security measures for the Ìlú Àṣẹ platform.

## Current Security Implementation

### Enhanced Features
1. **CORS Hardening**: Environment-specific CORS configuration with strict production rules
2. **Content Security Policy**: Comprehensive CSP with environment-aware policies
3. **Helmet Integration**: Full security header suite with proper configuration
4. **Security Monitoring**: API endpoints to monitor security configuration

## New Security Features

### 1. Environment-Aware Security
- **Development**: Relaxed security for easier development
- **Production**: Strict security policies with mandatory configuration
- **Staging**: Balanced security for testing

### 2. CORS Configuration
**Production Requirements:**
- `CORS_ALLOWED_ORIGINS` environment variable is mandatory
- Wildcard origins (`*`) are forbidden
- Only HTTPS origins allowed in production

**Development Configuration:**
- Allows localhost origins for development
- More permissive for local testing

### 3. Content Security Policy
**Production CSP Directives:**
```http
Content-Security-Policy: 
  default-src 'self';
  base-uri 'self';
  font-src 'self' https: data:;
  frame-ancestors 'none';
  img-src 'self' data: https://*.s3.amazonaws.com https://*.cloudinary.com;
  object-src 'none';
  script-src 'self';
  style-src 'self';
  upgrade-insecure-requests;
```

**Development CSP:**
- Same policies but with `report-only` mode
- Allows `unsafe-inline` for development convenience

### 4. Security Headers
The system now applies these security headers automatically:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` with restricted permissions

## API Endpoints

### GET /api/security/config
Returns current security configuration:
```json
{
  "cors": {
    "origins": ["https://app.example.com"],
    "credentials": true,
    "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  },
  "csp": {
    "enabled": true,
    "directives": { /* CSP directives */ },
    "reportOnly": false
  },
  "helmet": {
    "hsts": true,
    "frameguard": "deny",
    "contentSecurityPolicy": true
  },
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

### GET /api/security/headers
Returns all security headers applied to responses:
```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), ..."
}
```

### GET /api/security/recommendations
Provides security improvement recommendations:
```json
{
  "environment": "production",
  "recommendations": [
    "✅ Security configuration is production-ready",
    "✅ CORS is properly restricted",
    "✅ CSP is enforced"
  ]
}
```

## Configuration Requirements

### Production Environment Variables
```bash
# Required in production
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://yourapp.com,https://admin.yourapp.com
FRONTEND_URL=https://yourapp.com

# Optional but recommended
SENTRY_DSN=https://your-sentry-dsn
```

### Development Environment
```bash
# Development settings (more permissive)
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
# CORS_ALLOWED_ORIGINS not required in development
```

## Security Best Practices

### 1. CORS Configuration
- Never use wildcard (`*`) origins in production
- Limit origins to only necessary domains
- Use HTTPS for all production origins
- Regularly audit allowed origins

### 2. CSP Implementation
- Remove `unsafe-inline` and `unsafe-eval` in production
- Use nonce or hash-based script inclusion
- Regularly review and tighten policies
- Monitor CSP violation reports

### 3. Security Headers
- Enable HSTS with long max-age
- Use `frame-ancestors 'none'` to prevent clickjacking
- Implement proper referrer policy
- Restrict permissions via Permissions-Policy

### 4. Monitoring
- Regular security configuration audits
- Monitor CSP violation reports
- Log security header violations
- Regular penetration testing

## Migration Guide

### Moving to Production
1. Set `NODE_ENV=production`
2. Configure `CORS_ALLOWED_ORIGINS` with your domains
3. Ensure all origins use HTTPS
4. Test security endpoints
5. Verify no security warnings in recommendations

### Security Testing
```bash
# Check security configuration
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/security/config

# Get security recommendations
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/security/recommendations
```

## Troubleshooting

### Common Issues

**Error: "CORS_ALLOWED_ORIGINS is required in production"**
- Solution: Set the CORS_ALLOWED_ORIGINS environment variable with comma-separated HTTPS origins

**CSP Violations in Browser Console**
- Solution: Check CSP reports and adjust policies accordingly
- Use development mode (`report-only`) to test policies

**Security Header Missing**
- Solution: Verify Helmet configuration in main.ts
- Check that security service is properly initialized

### Debugging Steps
1. Check environment variables: `console.log(process.env.NODE_ENV)`
2. Verify CORS configuration: Test security/config endpoint
3. Check browser developer tools for CSP violations
4. Review server logs for security-related warnings

## Future Enhancements

### Planned Security Features
- [ ] Automated security scanning integration
- [ ] Dynamic CSP policy updates
- [ ] Advanced rate limiting
- [ ] Request smuggling protection
- [ ] Subresource Integrity (SRI) enforcement
- [ ] Certificate transparency monitoring

### Compliance Roadmap
- [ ] SOC 2 Type II compliance
- [ ] GDPR security measures
- [ ] PCI DSS requirements for payment processing
- [ ] HIPAA considerations for health data

## References
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CORS Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)