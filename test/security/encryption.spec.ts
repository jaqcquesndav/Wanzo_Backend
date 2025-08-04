import { EncryptionService } from '../../packages/shared/security/encryption.service';
import { EncryptedJsonTransformer } from '../../packages/shared/security/encrypted-transformers';

describe('Security Infrastructure Tests', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    // Set test environment variable
    process.env.ENCRYPTION_SECRET_KEY = 'test-key-for-security-tests-only-256-bits-long-string-here';
    encryptionService = new EncryptionService();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_SECRET_KEY;
  });

  describe('EncryptionService', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'Sensitive bank account: 123456789';
      const encrypted = encryptionService.encrypt(originalText);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
      expect(encrypted.encrypted).not.toBe(originalText);
      expect(encrypted.iv).toBeDefined();
    });

    it('should encrypt and decrypt objects correctly', () => {
      const originalObject = {
        accountNumber: '123456789',
        bankCode: 'ABC123',
        swiftCode: 'ABCDXYZ123'
      };

      const encrypted = encryptionService.encryptObject(originalObject);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(originalObject);
      expect(encrypted.encrypted).not.toContain('123456789');
    });

    it('should handle empty values gracefully', () => {
      const encrypted = encryptionService.encrypt('');
      expect(encrypted.encrypted).toBe('');

      const decrypted = encryptionService.decrypt({ encrypted: '', iv: '', tag: '' });
      expect(decrypted).toBe('');
    });

    it('should generate consistent hashes', () => {
      const text = 'test-account-number';
      const hash1 = encryptionService.hash(text);
      const hash2 = encryptionService.hash(text);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
    });
  });

  describe('EncryptedJsonTransformer', () => {
    it('should transform sensitive data for database storage', () => {
      const transformer = new EncryptedJsonTransformer(encryptionService);
      const sensitiveData = {
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        swiftCode: 'TESTXYZ123'
      };

      const transformed = transformer.to(sensitiveData);
      expect(transformed.encrypted).toBeDefined();
      expect(transformed.iv).toBeDefined();
      expect(transformed.encrypted).not.toContain('1234567890');

      const restored = transformer.from(transformed);
      expect(restored).toEqual(sensitiveData);
    });

    it('should handle null values properly', () => {
      const transformer = new EncryptedJsonTransformer(encryptionService);
      
      expect(transformer.to(null)).toBeNull();
      expect(transformer.to(undefined)).toBeNull();
      expect(transformer.from(null)).toBeNull();
    });

    it('should handle non-encrypted data gracefully', () => {
      const transformer = new EncryptedJsonTransformer(encryptionService);
      const plainData = { test: 'value' };
      
      // Should return original data if not encrypted
      const result = transformer.from(plainData);
      expect(result).toEqual(plainData);
    });
  });

  describe('Security Validation', () => {
    it('should not expose sensitive data in string representation', () => {
      const sensitiveData = {
        accountNumber: '1234567890',
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111'
      };

      const encrypted = encryptionService.encryptObject(sensitiveData);
      const encryptedString = JSON.stringify(encrypted);

      expect(encryptedString).not.toContain('1234567890');
      expect(encryptedString).not.toContain('123-45-6789');
      expect(encryptedString).not.toContain('4111-1111-1111-1111');
    });

    it('should use different IVs for same data', () => {
      const data = 'sensitive information';
      const encrypted1 = encryptionService.encrypt(data);
      const encrypted2 = encryptionService.encrypt(data);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      
      // But both should decrypt to the same value
      expect(encryptionService.decrypt(encrypted1)).toBe(data);
      expect(encryptionService.decrypt(encrypted2)).toBe(data);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted encrypted data', () => {
      const transformer = new EncryptedJsonTransformer(encryptionService);
      const corruptedData = {
        encrypted: 'corrupted-data',
        iv: 'invalid-iv',
        tag: 'invalid-tag'
      };

      // Should not throw, but return the original corrupted data
      const result = transformer.from(corruptedData);
      expect(result).toEqual(corruptedData);
    });

    it('should throw error when encryption key is missing', () => {
      delete process.env.ENCRYPTION_SECRET_KEY;
      
      expect(() => {
        new EncryptionService();
      }).toThrow('ENCRYPTION_SECRET_KEY must be set');
    });
  });
});
