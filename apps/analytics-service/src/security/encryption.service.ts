import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_SECRET_KEY || 'wanzo-backend-2025-ultra-secure-encryption-key-256-bits-change-this-in-production';
    this.secretKey = crypto.scryptSync(key, 'salt', 32);
  }

  encrypt(text: string): EncryptedData {
    if (!text) return { encrypted: '', iv: '', tag: '' };

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: ''
    };
  }

  decrypt(encryptedData: EncryptedData): string {
    if (!encryptedData.encrypted) return '';

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  encryptObject(obj: any): EncryptedData {
    return this.encrypt(JSON.stringify(obj));
  }

  decryptObject<T>(encryptedData: EncryptedData): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
