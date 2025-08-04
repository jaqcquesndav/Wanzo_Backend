import { ValueTransformer } from 'typeorm';
import { EncryptionService, EncryptedData } from './encryption.service';

export class EncryptedJsonTransformer implements ValueTransformer {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  to(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    
    try {
      const encrypted = this.encryptionService.encryptObject(value);
      return JSON.stringify(encrypted);
    } catch (error) {
      console.error('Error encrypting JSON data:', error);
      return JSON.stringify(value); // Fallback to unencrypted
    }
  }

  from(value: string | null): any {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      const encryptedData: EncryptedData = JSON.parse(value);
      
      // Check if data is encrypted (has the EncryptedData structure)
      if (encryptedData && typeof encryptedData === 'object' && 'encrypted' in encryptedData) {
        return this.encryptionService.decryptObject(encryptedData);
      }
      
      // If not encrypted, return as is (for backward compatibility)
      return JSON.parse(value);
    } catch (error) {
      console.error('Error decrypting JSON data:', error);
      try {
        return JSON.parse(value); // Try to parse as regular JSON
      } catch {
        return value; // Return raw value if all else fails
      }
    }
  }
}

export class EncryptedColumnTransformer implements ValueTransformer {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  to(value: string): string | null {
    if (value === null || value === undefined || value === '') {
      return value;
    }

    try {
      const encrypted = this.encryptionService.encrypt(value);
      return JSON.stringify(encrypted);
    } catch (error) {
      console.error('Error encrypting column data:', error);
      return value; // Fallback to unencrypted
    }
  }

  from(value: string | null): string | null {
    if (value === null || value === undefined || value === '') {
      return value;
    }

    try {
      const encryptedData: EncryptedData = JSON.parse(value);
      
      // Check if data is encrypted
      if (encryptedData && typeof encryptedData === 'object' && 'encrypted' in encryptedData) {
        return this.encryptionService.decrypt(encryptedData);
      }
      
      // If not encrypted, return as is
      return value;
    } catch (error) {
      console.error('Error decrypting column data:', error);
      return value; // Return raw value if decryption fails
    }
  }
}

export class EncryptedAccountTransformer implements ValueTransformer {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  to(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Si c'est déjà une chaîne (probablement cryptée), la retourner
    if (typeof value === 'string') {
      try {
        JSON.parse(value); // Test si c'est du JSON valide (données cryptées)
        return value;
      } catch {
        // Si ce n'est pas du JSON, c'est probablement du texte brut à crypter
        try {
          const encrypted = this.encryptionService.encrypt(value);
          return JSON.stringify(encrypted);
        } catch (error) {
          console.error('Error encrypting account data:', error);
          return value;
        }
      }
    }

    // Si c'est un objet, le crypter
    try {
      const encrypted = this.encryptionService.encryptObject(value);
      return JSON.stringify(encrypted);
    } catch (error) {
      console.error('Error encrypting account object:', error);
      return JSON.stringify(value);
    }
  }

  from(value: string | null): any {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      const encryptedData: EncryptedData = JSON.parse(value);
      
      // Check if data is encrypted
      if (encryptedData && typeof encryptedData === 'object' && 'encrypted' in encryptedData) {
        return this.encryptionService.decryptObject(encryptedData);
      }
      
      // If not encrypted, try to parse as JSON or return as string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Error decrypting account data:', error);
      return value;
    }
  }
}
