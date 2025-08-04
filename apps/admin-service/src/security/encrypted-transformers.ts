import { ValueTransformer } from 'typeorm';
import { EncryptionService, EncryptedData } from './encryption.service';

export class EncryptedColumnTransformer implements ValueTransformer {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

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

  from(value: any): any {
    if (!value || !value.encrypted) {
      return value;
    }

    try {
      return this.encryptionService.decrypt(value as EncryptedData);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return value;
    }
  }
}

export class EncryptedJsonTransformer implements ValueTransformer {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  to(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    return this.encryptionService.encryptObject(value);
  }

  from(value: any): any {
    if (!value || !value.encrypted) {
      return value;
    }

    try {
      return this.encryptionService.decryptObject(value as EncryptedData);
    } catch (error) {
      console.error('Error decrypting JSON data:', error);
      return value;
    }
  }
}
