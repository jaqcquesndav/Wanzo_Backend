import { EncryptionService } from '../../src/security/encryption.service';
import { EncryptedJsonTransformer, EncryptedColumnTransformer } from '../../src/security/encrypted-transformers';

describe('Analytics Service - Security', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    // Utiliser une clé de test
    process.env.ENCRYPTION_SECRET_KEY = 'test-key-32-chars-long-for-aes256';
    encryptionService = new EncryptionService();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_SECRET_KEY;
  });

  describe('EncryptionService', () => {
    it('should encrypt and decrypt strings correctly', () => {
      const originalData = 'sensitive analytics data';
      const encrypted = encryptionService.encrypt(originalData);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(encrypted).not.toBe(originalData);
      expect(decrypted).toBe(originalData);
    });

    it('should encrypt and decrypt objects correctly', () => {
      const originalData = {
        analyticsId: 'ANALYTICS_12345',
        metrics: {
          revenue: 150000,
          users: 1250,
          conversion: 0.025
        },
        reports: ['monthly', 'quarterly']
      };

      const encrypted = encryptionService.encryptObject(originalData);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(encrypted).not.toBe(JSON.stringify(originalData));
      expect(decrypted).toEqual(originalData);
    });

    it('should generate different encrypted values for same input', () => {
      const data = 'analytics metric data';
      const encrypted1 = encryptionService.encrypt(data);
      const encrypted2 = encryptionService.encrypt(data);

      expect(encrypted1).not.toBe(encrypted2);
      expect(encryptionService.decrypt(encrypted1)).toBe(data);
      expect(encryptionService.decrypt(encrypted2)).toBe(data);
    });

    it('should handle empty strings', () => {
      const encrypted = encryptionService.encrypt('');
      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle null values gracefully', () => {
      expect(() => encryptionService.encrypt(null as any)).not.toThrow();
      expect(() => encryptionService.decrypt(null as any)).not.toThrow();
    });
  });

  describe('EncryptedJsonTransformer', () => {
    let transformer: EncryptedJsonTransformer;

    beforeEach(() => {
      transformer = new EncryptedJsonTransformer();
    });

    it('should transform analytics data to encrypted format', () => {
      const analyticsData = {
        clientId: 'CLIENT_789',
        metrics: {
          pageViews: 50000,
          sessions: 12000,
          bounceRate: 0.35
        },
        segments: ['premium', 'enterprise']
      };

      const encrypted = transformer.to(analyticsData);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toContain('CLIENT_789');
      expect(encrypted).not.toContain('premium');
    });

    it('should transform from encrypted format back to analytics data', () => {
      const originalData = {
        dashboardId: 'DASH_456',
        filters: {
          dateRange: '2024-01-01_2024-12-31',
          region: 'west-africa',
          currency: 'XOF'
        }
      };

      const encrypted = transformer.to(originalData);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toEqual(originalData);
    });

    it('should handle null values in transformation', () => {
      expect(transformer.to(null)).toBeNull();
      expect(transformer.from(null)).toBeNull();
    });
  });

  describe('EncryptedColumnTransformer', () => {
    let transformer: EncryptedColumnTransformer;

    beforeEach(() => {
      transformer = new EncryptedColumnTransformer();
    });

    it('should encrypt analytics configuration strings', () => {
      const configString = 'ANALYTICS_API_KEY_xyz789_SECRET';
      const encrypted = transformer.to(configString);
      
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(configString);
      expect(encrypted).not.toContain('ANALYTICS_API_KEY');
    });

    it('should decrypt back to original configuration', () => {
      const originalConfig = 'GOOGLE_ANALYTICS_TRACKING_ID_UA-123456789-1';
      const encrypted = transformer.to(originalConfig);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toBe(originalConfig);
    });

    it('should handle various analytics identifiers', () => {
      const testCases = [
        'MIXPANEL_TOKEN_abc123def456',
        'AMPLITUDE_API_KEY_789xyz',
        'SEGMENT_WRITE_KEY_seg_123_write',
        'HOTJAR_SITE_ID_2345678'
      ];

      testCases.forEach(identifier => {
        const encrypted = transformer.to(identifier);
        const decrypted = transformer.from(encrypted);
        
        expect(decrypted).toBe(identifier);
        expect(encrypted).not.toBe(identifier);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', () => {
      // Test avec une clé invalide
      const originalKey = process.env.ENCRYPTION_SECRET_KEY;
      process.env.ENCRYPTION_SECRET_KEY = 'too-short';
      
      const service = new EncryptionService();
      
      expect(() => {
        service.encrypt('test data');
      }).toThrow();

      process.env.ENCRYPTION_SECRET_KEY = originalKey;
    });

    it('should handle decryption of invalid data', () => {
      const invalidData = { encrypted: 'invalid-data', iv: '', tag: '' };
      expect(() => {
        encryptionService.decrypt(invalidData);
      }).toThrow();
    });

    it('should handle malformed encrypted objects', () => {
      const invalidData = { encrypted: 'not-valid-json', iv: '', tag: '' };
      expect(() => {
        encryptionService.decryptObject(invalidData);
      }).toThrow();
    });
  });

  describe('Analytics-Specific Security Tests', () => {
    it('should encrypt sensitive analytics metrics', () => {
      const sensitiveMetrics = {
        revenue: {
          total: 2500000,
          byRegion: {
            'dakar': 1200000,
            'abidjan': 800000,
            'bamako': 500000
          }
        },
        customers: {
          count: 15000,
          premium: 2500,
          enterprise: 150
        },
        transactions: {
          volume: 45000,
          value: 18500000,
          fees: 925000
        }
      };

      const encrypted = encryptionService.encryptObject(sensitiveMetrics);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(encrypted).not.toContain('2500000');
      expect(encrypted).not.toContain('dakar');
      expect(encrypted).not.toContain('premium');
      expect(decrypted).toEqual(sensitiveMetrics);
    });

    it('should encrypt dashboard configurations', () => {
      const dashboardConfig = {
        widgets: [
          {
            type: 'revenue_chart',
            apiEndpoint: '/api/analytics/revenue',
            refreshInterval: 300000
          },
          {
            type: 'user_metrics',
            query: 'SELECT COUNT(*) FROM users WHERE premium = true',
            dataSource: 'main_db'
          }
        ],
        permissions: {
          viewRevenue: ['admin', 'finance'],
          exportData: ['admin'],
          realTimeAccess: ['admin', 'operations']
        }
      };

      const encrypted = encryptionService.encryptObject(dashboardConfig);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(encrypted).not.toContain('premium');
      expect(encrypted).not.toContain('main_db');
      expect(encrypted).not.toContain('admin');
      expect(decrypted).toEqual(dashboardConfig);
    });
  });
});
