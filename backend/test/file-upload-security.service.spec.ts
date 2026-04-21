import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FileUploadSecurityService } from '../src/security/file-upload-security.service';

describe('FileUploadSecurityService', () => {
  let service: FileUploadSecurityService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadSecurityService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FileUploadSecurityService>(FileUploadSecurityService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateFileUpload', () => {
    it('should accept a valid image file', () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/tmp',
        filename: 'test.jpg',
        path: '/tmp/test.jpg',
        buffer: Buffer.from('test'),
      };

      expect(() => service.validateFileUpload(file)).not.toThrow();
    });

    it('should accept a valid PDF file', () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        destination: '/tmp',
        filename: 'document.pdf',
        path: '/tmp/document.pdf',
        buffer: Buffer.from('test'),
      };

      expect(() => service.validateFileUpload(file)).not.toThrow();
    });

    it('should reject files that are too large', () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'large-file.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024, // 15MB, exceeding default 10MB limit
        destination: '/tmp',
        filename: 'large-file.jpg',
        path: '/tmp/large-file.jpg',
        buffer: Buffer.from('test'),
      };

      expect(() => service.validateFileUpload(file)).toThrow(
        'File size 15728640 bytes exceeds maximum allowed size of 10485760 bytes',
      );
    });

    it('should reject files with invalid mime types', () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'malicious.exe',
        encoding: '7bit',
        mimetype: 'application/x-msdownload',
        size: 1024,
        destination: '/tmp',
        filename: 'malicious.exe',
        path: '/tmp/malicious.exe',
        buffer: Buffer.from('test'),
      };

      expect(() => service.validateFileUpload(file)).toThrow(
        'File type "application/x-msdownload" is not allowed.',
      );
    });

    it('should reject files with directory traversal attempts', () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: '../../../malicious.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/tmp',
        filename: 'malicious.jpg',
        path: '/tmp/malicious.jpg',
        buffer: Buffer.from('test'),
      };

      expect(() => service.validateFileUpload(file)).toThrow(
        'Potentially malicious filename detected',
      );
    });

    it('should accept files with custom size limits', () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024, // 15MB
        destination: '/tmp',
        filename: 'test.jpg',
        path: '/tmp/test.jpg',
        buffer: Buffer.from('test'),
      };

      const options = {
        maxSize: 20 * 1024 * 1024, // 20MB
        allowedTypes: ['image/jpeg'],
      };

      expect(() => service.validateFileUpload(file, options)).not.toThrow();
    });

    it('should reject files with mismatched extensions', () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.jpg', // claims to be JPG but actually PDF
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        destination: '/tmp',
        filename: 'document.jpg',
        path: '/tmp/document.jpg',
        buffer: Buffer.from('test'),
      };

      expect(() => service.validateFileUpload(file)).toThrow(
        'File extension "jpg" doesn\'t match detected file type "application/pdf"',
      );
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      const maliciousName = '../../../etc/passwd';
      const sanitized = service.sanitizeFilename(maliciousName);
      expect(sanitized).toBe('etc/passwd');
    });

    it('should replace dangerous characters', () => {
      const dangerousName = 'file<>.txt';
      const sanitized = service.sanitizeFilename(dangerousName);
      expect(sanitized).toBe('file__.txt');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = service.sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThan(longName.length);
      expect(sanitized).toMatch(/\.txt$/);
    });

    it('should handle normal filenames correctly', () => {
      const normalName = 'my-document.pdf';
      const sanitized = service.sanitizeFilename(normalName);
      expect(sanitized).toBe(normalName);
    });
  });

  describe('getSecurityRecommendations', () => {
    it('should return recommendations', () => {
      const recommendations = service.getSecurityRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(service.getFileExtension('test.jpg')).toBe('jpg');
      expect(service.getFileExtension('document.pdf')).toBe('pdf');
      expect(service.getFileExtension('archive.tar.gz')).toBe('gz');
    });
  });
});