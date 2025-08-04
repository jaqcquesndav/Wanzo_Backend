import { ValueTransformer } from 'typeorm';
import { EncryptionService, EncryptedData } from './encryption.service';

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
