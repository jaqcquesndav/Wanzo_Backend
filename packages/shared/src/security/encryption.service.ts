import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_SECRET_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_SECRET_KEY must be set in environment variables');
    }
    
    // Ensure key is 32 bytes for AES-256
    this.secretKey = crypto.scryptSync(key, 'salt', 32);
  }

  /**
   * Crypte une chaîne de caractères
   * @param text Texte à crypter
   * @returns Objet contenant les données cryptées
   */
  encrypt(text: string): EncryptedData {
    if (!text) return { encrypted: '', iv: '', tag: '' };

    const iv = crypto.randomBytes(16); // 16 bytes pour AES
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Décrypte des données cryptées
   * @param encryptedData Données cryptées
   * @returns Texte décrypté
   */
  decrypt(encryptedData: EncryptedData): string {
    if (!encryptedData.encrypted) return '';

    const decipher = crypto.createDecipheriv(
      this.algorithm, 
      this.secretKey, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Crypte un objet JSON
   * @param obj Objet à crypter
   * @returns Données cryptées
   */
  encryptObject(obj: any): EncryptedData {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Décrypte vers un objet JSON
   * @param encryptedData Données cryptées
   * @returns Objet décrypté
   */
  decryptObject<T>(encryptedData: EncryptedData): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }

  /**
   * Hash une chaîne avec SHA-256 (pour indexation)
   * @param text Texte à hasher
   * @returns Hash en hexadécimal
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Génère un salt aléatoire
   * @returns Salt en hexadécimal
   */
  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
