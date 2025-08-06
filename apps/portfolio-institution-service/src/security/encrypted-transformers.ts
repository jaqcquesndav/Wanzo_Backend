import { ValueTransformer } from 'typeorm';
import { EncryptionService, EncryptedData } from './encryption.service';

/**
 * Transformateur TypeORM pour crypter/décrypter automatiquement les colonnes sensibles
 */
export class EncryptedColumnTransformer implements ValueTransformer {
  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Transformation vers la base de données (cryptage)
   */
  to(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      return this.encryptionService.encrypt(value);
    }

    if (typeof value === 'object') {
      return this.encryptionService.encryptObject(value);
    }

    return this.encryptionService.encrypt(String(value));
  }

  /**
   * Transformation depuis la base de données (décryptage)
   */
  from(value: any): any {
    if (!value || !value.encrypted) {
      return null;
    }

    try {
      return this.encryptionService.decrypt(value as EncryptedData);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }
}

/**
 * Transformateur pour objets JSON cryptés
 */
export class EncryptedJsonTransformer implements ValueTransformer {
  private encryptionService: EncryptionService;
  private serviceInitialized = false;

  constructor() {
    try {
      // Try to initialize the encryption service
      this.encryptionService = new EncryptionService();
      this.serviceInitialized = true;
    } catch (error) {
      console.error('Failed to initialize EncryptionService in transformer:', error);
      // Will try to initialize later when needed
    }
  }

  // Helper to ensure encryption service is initialized
  private getEncryptionService(): EncryptionService {
    if (!this.serviceInitialized) {
      try {
        this.encryptionService = new EncryptionService();
        this.serviceInitialized = true;
      } catch (error) {
        console.error('Failed to initialize EncryptionService in transformer:', error);
        throw new Error('EncryptionService could not be initialized. Check environment variables.');
      }
    }
    return this.encryptionService;
  }

  to(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    return this.getEncryptionService().encryptObject(value);
  }

  from(value: any): any {
    if (!value || !value.encrypted) {
      return value; // Return as-is if not encrypted
    }

    try {
      return this.getEncryptionService().decryptObject(value as EncryptedData);
    } catch (error) {
      console.error('Error decrypting JSON data:', error);
      return value; // Return original value if decryption fails
    }
  }
}

/**
 * Transformateur pour les numéros de compte (avec indexation possible)
 */
export class EncryptedAccountTransformer implements ValueTransformer {
  private encryptionService: EncryptionService;
  private serviceInitialized = false;

  constructor() {
    try {
      this.encryptionService = new EncryptionService();
      this.serviceInitialized = true;
    } catch (error) {
      console.error('Failed to initialize EncryptionService in EncryptedAccountTransformer:', error);
      // Will try to initialize later when needed
    }
  }
  
  private getEncryptionService(): EncryptionService {
    if (!this.serviceInitialized) {
      try {
        this.encryptionService = new EncryptionService();
        this.serviceInitialized = true;
      } catch (error) {
        console.error('Failed to initialize EncryptionService in transformer:', error);
        throw new Error('EncryptionService could not be initialized. Check environment variables.');
      }
    }
    return this.encryptionService;
  }

  to(value: any): any {
    if (!value) return null;

    const encrypted = this.getEncryptionService().encrypt(value);
    
    // Ajouter un hash pour permettre l'indexation/recherche si nécessaire
    return {
      ...encrypted,
      hash: this.getEncryptionService().hash(value)
    };
  }

  from(value: any): any {
    if (!value || !value.encrypted) {
      return null;
    }

    try {
      return this.getEncryptionService().decrypt({
        encrypted: value.encrypted,
        iv: value.iv,
        tag: value.tag
      });
    } catch (error) {
      console.error('Error decrypting account data:', error);
      return null;
    }
  }
}
