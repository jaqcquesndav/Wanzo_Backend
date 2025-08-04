import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from '../packages/shared/security/encryption.service';
import { EncryptedColumnTransformer, EncryptedJsonTransformer } from '../packages/shared/security/encrypted-transformers';

describe('Security Encryption Tests', () => {
  let encryptionService: EncryptionService;
  let columnTransformer: EncryptedColumnTransformer;
  let jsonTransformer: EncryptedJsonTransformer;

  beforeEach(async () => {
    // Set test environment variable
    process.env.ENCRYPTION_SECRET_KEY = 'test-key-for-security-testing-256-bits-long-enough-for-aes';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    encryptionService = module.get<EncryptionService>(EncryptionService);
    columnTransformer = new EncryptedColumnTransformer(encryptionService);
    jsonTransformer = new EncryptedJsonTransformer(encryptionService);
  });

  describe('EncryptionService', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'sensitive-account-number-123456789';
      const encrypted = encryptionService.encrypt(originalText);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
      expect(encrypted.encrypted).not.toBe(originalText);
      expect(encrypted.iv).toBeDefined();
    });

    it('should encrypt and decrypt objects correctly', () => {
      const originalObject = {
        accountNumber: '1234567890',
        bankCode: 'ABC123',
        swiftCode: 'ABCDFRPP'
      };

      const encrypted = encryptionService.encryptObject(originalObject);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(originalObject);
      expect(encrypted.encrypted).not.toContain(originalObject.accountNumber);
    });

    it('should handle empty and null values', () => {
      expect(encryptionService.encrypt('')).toEqual({ encrypted: '', iv: '', tag: '' });
      expect(encryptionService.decrypt({ encrypted: '', iv: '', tag: '' })).toBe('');
    });

    it('should generate consistent hashes', () => {
      const text = 'test-account-number';
      const hash1 = encryptionService.hash(text);
      const hash2 = encryptionService.hash(text);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
    });
  });

  describe('EncryptedColumnTransformer', () => {
    it('should transform sensitive phone numbers', () => {
      const phoneNumber = '+237123456789';
      
      const encrypted = columnTransformer.to(phoneNumber);
      const decrypted = columnTransformer.from(encrypted);

      expect(decrypted).toBe(phoneNumber);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.encrypted).not.toBe(phoneNumber);
    });

    it('should handle null values gracefully', () => {
      expect(columnTransformer.to(null)).toBeNull();
      expect(columnTransformer.to(undefined)).toBeNull();
      expect(columnTransformer.to('')).toBeNull();
    });
  });

  describe('EncryptedJsonTransformer', () => {
    it('should transform bank account data', () => {
      const bankData = {
        accountNumber: '1234567890123456',
        bankName: 'Test Bank',
        bankCode: 'TEST001',
        swiftCode: 'TESTFRPP'
      };

      const encrypted = jsonTransformer.to(bankData);
      const decrypted = jsonTransformer.from(encrypted);

      expect(decrypted).toEqual(bankData);
      expect(encrypted.encrypted).not.toContain(bankData.accountNumber);
    });

    it('should transform mobile money data', () => {
      const mobileMoneyData = {
        provider: 'MTN',
        number: '+237123456789',
        accountName: 'John Doe'
      };

      const encrypted = jsonTransformer.to(mobileMoneyData);
      const decrypted = jsonTransformer.from(encrypted);

      expect(decrypted).toEqual(mobileMoneyData);
      expect(encrypted.encrypted).not.toContain(mobileMoneyData.number);
    });

    it('should handle payment gateway responses', () => {
      const gatewayResponse = {
        transactionId: 'TXN123456789',
        status: 'success',
        cardToken: 'tok_1234567890abcdef',
        lastFourDigits: '1234'
      };

      const encrypted = jsonTransformer.to(gatewayResponse);
      const decrypted = jsonTransformer.from(gatewayResponse);

      expect(decrypted).toEqual(gatewayResponse);
      expect(encrypted.encrypted).not.toContain(gatewayResponse.cardToken);
    });
  });

  describe('Security Compliance Tests', () => {
    it('should not store sensitive data in plain text', () => {
      const sensitiveData = [
        '4111111111111111', // Credit card
        'FR1420041010050500013M02606', // IBAN
        '+237123456789', // Phone
        'acc_1234567890' // Account number
      ];

      sensitiveData.forEach(data => {
        const encrypted = encryptionService.encrypt(data);
        expect(encrypted.encrypted).not.toContain(data);
        expect(encrypted.iv).toBeDefined();
      });
    });

    it('should use different IVs for same data', () => {
      const data = 'same-sensitive-data';
      const encrypted1 = encryptionService.encrypt(data);
      const encrypted2 = encryptionService.encrypt(data);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      
      // But both should decrypt to the same value
      expect(encryptionService.decrypt(encrypted1)).toBe(data);
      expect(encryptionService.decrypt(encrypted2)).toBe(data);
    });

    it('should handle malformed encrypted data gracefully', () => {
      const malformedData = { encrypted: 'invalid', iv: 'invalid', tag: '' };
      
      // Should not throw, should return fallback
      const result = columnTransformer.from(malformedData);
      expect(result).toBe(malformedData); // Returns original on error
    });
  });

  describe('Performance Tests', () => {
    it('should encrypt large objects efficiently', () => {
      const largeObject = {
        accountNumbers: Array(100).fill(0).map((_, i) => `account_${i}_1234567890`),
        transactions: Array(50).fill(0).map((_, i) => ({
          id: `txn_${i}`,
          amount: Math.random() * 1000,
          cardToken: `tok_${i}_abcdefghijklmnop`
        }))
      };

      const startTime = Date.now();
      const encrypted = encryptionService.encryptObject(largeObject);
      const decrypted = encryptionService.decryptObject(encrypted);
      const endTime = Date.now();

      expect(decrypted).toEqual(largeObject);
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
    });
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_SECRET_KEY;
  });
});

// Integration tests for specific entities
describe('Entity Integration Tests', () => {
  describe('Disbursement Entity Encryption', () => {
    it('should encrypt bank account details', () => {
      const transformer = new EncryptedJsonTransformer();
      
      const debitAccount = {
        accountNumber: '1234567890123456',
        accountName: 'Company ABC',
        bankName: 'Test Bank',
        bankCode: 'TB001',
        branchCode: 'BR001'
      };

      const encrypted = transformer.to(debitAccount);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toEqual(debitAccount);
      expect(encrypted.encrypted).not.toContain('1234567890123456');
    });
  });

  describe('Customer Entity Encryption', () => {
    it('should encrypt phone numbers', () => {
      const transformer = new EncryptedColumnTransformer();
      
      const phoneNumber = '+237123456789';
      const encrypted = transformer.to(phoneNumber);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toBe(phoneNumber);
      expect(encrypted.encrypted).not.toContain('123456789');
    });

    it('should encrypt contact information', () => {
      const transformer = new EncryptedJsonTransformer();
      
      const contacts = {
        email: 'contact@company.com',
        phone: '+237123456789',
        altPhone: '+237987654321'
      };

      const encrypted = transformer.to(contacts);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toEqual(contacts);
      expect(encrypted.encrypted).not.toContain('123456789');
    });
  });

  describe('Payment Entity Encryption', () => {
    it('should encrypt gateway responses', () => {
      const transformer = new EncryptedJsonTransformer();
      
      const gatewayResponse = {
        transactionId: 'txn_1234567890',
        cardToken: 'tok_abcdefghijklmnop',
        authCode: 'AUTH123456',
        networkTransactionId: 'net_9876543210'
      };

      const encrypted = transformer.to(gatewayResponse);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toEqual(gatewayResponse);
      expect(encrypted.encrypted).not.toContain('tok_abcdefghijklmnop');
    });
  });
});
