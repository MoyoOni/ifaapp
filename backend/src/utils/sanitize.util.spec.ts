import { sanitizeInput, sanitizeHtml, sanitizeUrl, sanitizeUserContent } from './sanitize.util';

describe('Sanitization Utilities', () => {
  describe('sanitizeInput', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      expect(sanitizeInput(input)).toBe(expected);
    });

    it('should remove script tags', () => {
      const input = 'Hello <SCRIPT>evil();</SCRIPT> world';
      const expected = 'Hello &lt;SCRIPT&gt;evil();&lt;&#x2F;SCRIPT&gt; world';
      expect(sanitizeInput(input)).toBe(expected);
    });

    it('should handle regular text', () => {
      const input = 'Hello, world!';
      expect(sanitizeInput(input)).toBe('Hello, world!');
    });

    it('should handle null/undefined input', () => {
      expect(sanitizeInput(null as any)).toBeNull();
      expect(sanitizeInput(undefined as any)).toBeUndefined();
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML content', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const expected = '&lt;p&gt;Hello &lt;strong&gt;world&lt;&#x2F;strong&gt;&lt;&#x2F;p&gt;';
      expect(sanitizeHtml(input)).toBe(expected);
    });

    it('should handle XSS attempts', () => {
      const input = '<img src="x" onerror="alert(\'XSS\')">';
      const expected = '&lt;img src=&quot;x&quot; onerror=&quot;alert(&#x27;XSS&#x27;)&quot;&gt;';
      expect(sanitizeHtml(input)).toBe(expected);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTP/HTTPS URLs', () => {
      const validUrl = 'https://example.com/path';
      expect(sanitizeUrl(validUrl)).toBe(validUrl);
    });

    it('should allow valid HTTP URLs', () => {
      const validUrl = 'http://example.com';
      expect(sanitizeUrl(validUrl)).toBe(validUrl);
    });

    it('should reject invalid URLs', () => {
      const invalidUrl = 'javascript:alert(document.domain)';
      expect(sanitizeUrl(invalidUrl)).toBe('');
    });

    it('should reject data URLs', () => {
      const dataUrl = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K';
      expect(sanitizeUrl(dataUrl)).toBe('');
    });
  });

  describe('sanitizeUserContent', () => {
    it('should sanitize text content', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      expect(sanitizeUserContent(input, 'text')).toBe(expected);
    });

    it('should sanitize HTML content', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const expected = '&lt;p&gt;Hello &lt;strong&gt;world&lt;&#x2F;strong&gt;&lt;&#x2F;p&gt;';
      expect(sanitizeUserContent(input, 'html')).toBe(expected);
    });

    it('should sanitize URL content', () => {
      const validUrl = 'https://example.com';
      expect(sanitizeUserContent(validUrl, 'url')).toBe(validUrl);
    });

    it('should handle default type as text', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      expect(sanitizeUserContent(input)).toBe(expected);
    });
  });
});