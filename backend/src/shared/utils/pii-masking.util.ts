export class PiiMaskingUtil {
  // Fields that typically contain PII
  private static PII_FIELDS = [
    'email',
    'phone',
    'phoneNumber',
    'mobile',
    'address',
    'location',
    'name',
    'firstName',
    'lastName',
    'fullName',
    'password',
    'passwordHash',
    'ssn',
    'socialSecurity',
    'idNumber',
    'taxId',
    'bankAccount',
    'accountNumber',
    'routingNumber',
    'cardNumber',
    'creditCard',
    'dob',
    'dateOfBirth',
    'birthDate',
    'passport',
    'license',
    'driverLicense',
    'ipAddress',
    'userAgent',
    'coordinates',
    'latitude',
    'longitude',
    'location',
    'bio',
    'aboutMe',
    'content',
    'message',
    'description',
    'notes',
    'review',
    'feedback',
    'document',
    'filename',
    'originalFilename',
    's3Key',
    'signedUrl',
    'url',
    'videoRoomId',
    'videoToken',
    'trackingNumber',
    'shippingAddress',
    'billingAddress',
    'walletId',
    'transactionId',
    'paymentId',
    'reference',
    'evidence',
    'images',
    'documentation',
    'mentorEndorsements',
    'socialLinks',
    'attachments',
    'data',
    'payload',
    'metadata',
    'previousValues',
    'newValues'
  ];

  /**
   * Checks if a field name likely contains PII
   */
  private static isPiiField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return this.PII_FIELDS.some(piiField => 
      lowerFieldName.includes(piiField.toLowerCase())
    );
  }

  /**
   * Masks a single value based on its type
   */
  private static maskValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      // For emails, phone numbers, and other common PII formats
      if (this.isEmail(value)) {
        return this.maskEmail(value);
      } else if (this.isPhoneNumber(value)) {
        return this.maskPhoneNumber(value);
      } else if (value.length > 4) {
        // Generic masking for longer strings
        const visibleChars = Math.max(1, Math.floor(value.length / 4));
        return value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars * 2) + 
               value.substring(value.length - visibleChars);
      } else {
        // For shorter strings, return asterisks
        return '*'.repeat(value.length);
      }
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map(item => this.maskValue(item));
      } else {
        return this.maskObject(value);
      }
    }

    // For non-string values, return as is
    return value;
  }

  /**
   * Masks PII in an object
   */
  public static maskObject(obj: Record<string, any>): Record<string, any> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const maskedObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isPiiField(key)) {
        maskedObj[key] = this.maskValue(value);
      } else {
        // Still check nested objects for PII even if field name isn't recognized
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            maskedObj[key] = value.map(item => this.maskValue(item));
          } else {
            maskedObj[key] = this.maskObject(value);
          }
        } else {
          maskedObj[key] = value;
        }
      }
    }

    return maskedObj;
  }

  /**
   * Checks if a string looks like an email
   */
  private static isEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  /**
   * Checks if a string looks like a phone number
   */
  private static isPhoneNumber(str: string): boolean {
    // Simple check: contains digits and common phone separators
    return /[\d\s\-\+\(\)]{7,}/.test(str) && /\d/.test(str);
  }

  /**
   * Masks an email address
   */
  private static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    
    if (!localPart || !domain) {
      return email; // Not a valid email
    }

    const visibleLocalLength = Math.max(1, Math.min(3, Math.floor(localPart.length / 3)));
    const maskedLocal = localPart.substring(0, visibleLocalLength) + 
                        '*'.repeat(Math.max(0, localPart.length - visibleLocalLength * 2)) +
                        (localPart.length > visibleLocalLength ? localPart.substring(localPart.length - visibleLocalLength) : '');

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Masks a phone number
   */
  private static maskPhoneNumber(phone: string): string {
    // Extract only digits
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length < 4) {
      return '*'.repeat(phone.length);
    }

    // Show first and last 2 digits, mask the rest
    const visibleStart = Math.min(2, Math.floor(digits.length / 4));
    const visibleEnd = Math.min(2, Math.floor(digits.length / 4));

    const maskedDigits = digits.substring(0, visibleStart) + 
                         '*'.repeat(Math.max(0, digits.length - visibleStart - visibleEnd)) +
                         (digits.length > visibleStart ? digits.substring(digits.length - visibleEnd) : '');

    // Preserve original formatting by replacing digits
    let result = '';
    let digitIndex = 0;
    
    for (let i = 0; i < phone.length; i++) {
      const char = phone[i];
      if (/\d/.test(char)) {
        result += maskedDigits[digitIndex];
        digitIndex++;
      } else {
        result += char;
      }
    }
    
    return result;
  }
}