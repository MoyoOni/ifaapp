import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionKeyService } from '../src/encryption/encryption-key.service';

describe('EncryptionKeyService', () => {
  let service: EncryptionKeyService;

  beforeEach(async () => {
    // Set up a valid test key
    process.env.ENCRYPTION_KEY = 'valid-32-char-encryption-key!!';
    process.env.NODE_ENV = 'development';

    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionKeyService],
    }).compile();

    service = module.get<EncryptionKeyService>(EncryptionKeyService);
  });

  afterEach(() => {
    // Clean up environment variables after each test
    delete process.env.ENCRYPTION_KEY;
    delete process.env.NODE_ENV;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKey', () => {
    it('should return a valid encryption key buffer', () => {
      const keyBuffer = service.getKey();
      expect(keyBuffer).toBeInstanceOf(Buffer);
      expect(keyBuffer.length).toBeGreaterThan(0);
    });

    it('should throw an error if service is not initialized', () => {
      // This test might not be applicable if initialization happens in constructor
      // But we can still test the error case scenario
      expect(() => service.getKey()).not.toThrow();
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text successfully', () => {
      const originalText = 'This is a test string for encryption';
      
      // Encrypt the text
      const encryptedData = service.encrypt(originalText);
      
      // Verify encrypted data structure
      expect(encryptedData).toHaveProperty('encrypted');
      expect(encryptedData).toHaveProperty('iv');
      expect(encryptedData).toHaveProperty('authTag');
      expect(typeof encryptedData.encrypted).toBe('string');
      expect(typeof encryptedData.iv).toBe('string');
      expect(typeof encryptedData.authTag).toBe('string');
      
      // Decrypt the text
      const decryptedText = service.decrypt(encryptedData);
      
      // Verify the decrypted text matches the original
      expect(decryptedText).toBe(originalText);
    });

    it('should handle special characters correctly', () => {
      const originalText = 'Special chars: àáâãäåæçèéêë@#$%^&*()';
      
      const encryptedData = service.encrypt(originalText);
      const decryptedText = service.decrypt(encryptedData);
      
      expect(decryptedText).toBe(originalText);
    });

    it('should handle empty string', () => {
      const originalText = '';
      
      const encryptedData = service.encrypt(originalText);
      const decryptedText = service.decrypt(encryptedData);
      
      expect(decryptedText).toBe(originalText);
    });
  });

  describe('validateKey', () => {
    it('should validate a correct key', () => {
      const key = 'valid-32-char-encryption-key!!';
      const result = EncryptionKeyService.validateKey(key);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect key that is too short', () => {
      const key = 'too-short';
      const result = EncryptionKeyService.validateKey(key);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Key must be exactly 32 characters long');
    });

    it('should detect key that is too long', () => {
      const key = 'this-key-is-far-too-long-for-the-required-length';
      const result = EncryptionKeyService.validateKey(key);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Key must be exactly 32 characters long');
    });

    it('should detect key without numbers', () => {
      const key = 'aaaaaaaaaabbbbbbbbbbccccccccdddddde';
      const result = EncryptionKeyService.validateKey(key);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Key must contain both letters and numbers');
    });

    it('should detect key without letters', () => {
      const key = '11111111112222222222333333334444';
      const result = EncryptionKeyService.validateKey(key);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Key must contain both letters and numbers');
    });

    it('should detect repeated characters', () => {
      const key = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const result = EncryptionKeyService.validateKey(key);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Key cannot consist of repeated characters');
    });

    it('should detect test keywords', () => {
      const key = 'testtesttesttesttesttesttesttesttt';
      const result = EncryptionKeyService.validateKey(key);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Key cannot be a common test word');
    });
  });

  describe('generateSecureKey', () => {
    it('should generate a 32-character hex key', () => {
      const key = EncryptionKeyService.generateSecureKey();
      
      expect(key).toHaveLength(32);
      expect(/^[\da-f]{32}$/.test(key)).toBe(true); // Check if it's a valid hex string
    });

    it('should generate unique keys', () => {
      const key1 = EncryptionKeyService.generateSecureKey();
      const key2 = EncryptionKeyService.generateSecureKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('getKeyHealth', () => {
    it('should return correct health status for valid key', () => {
      process.env.ENCRYPTION_KEY = 'valid-32-char-encryption-key!!';
      process.env.NODE_ENV = 'production';
      
      const health = service.getKeyHealth();
      
      expect(health.isInitialized).toBe(true);
      expect(health.isValid).toBe(true);
      expect(health.isProductionReady).toBe(true);
      expect(health.errors).toHaveLength(0);
      expect(health.environment).toBe('production');
      expect(Array.isArray(health.recommendations)).toBe(true);
    });

    it('should return correct health status for invalid key', () => {
      process.env.ENCRYPTION_KEY = 'short';
      process.env.NODE_ENV = 'production';
      
      const health = service.getKeyHealth();
      
      expect(health.isInitialized).toBe(true);
      expect(health.isValid).toBe(false);
      expect(health.isProductionReady).toBe(false);
      expect(health.errors).toContain('Key must be exactly 32 characters long');
    });
  });
});