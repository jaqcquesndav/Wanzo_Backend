import * as crypto from 'crypto';

/**
 * Service de chiffrement/déchiffrement pour sécuriser les données sensibles dans Kafka
 * Utilise AES-256-CBC pour le chiffrement symétrique
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // Longueur du vecteur d'initialisation pour AES

/**
 * Génère une clé de chiffrement depuis une passphrase
 * En production, utiliser process.env.KAFKA_ENCRYPTION_KEY
 */
function getEncryptionKey(): Buffer {
  const key = process.env.KAFKA_ENCRYPTION_KEY || 'wanzo-default-encryption-key-change-in-prod';
  return crypto.scryptSync(key, 'salt', 32); // Dérive une clé de 256 bits
}

/**
 * Chiffre des données sensibles avec AES-256-CBC
 */
export function encryptSensitiveData(data: any): { encrypted: string; iv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const jsonString = JSON.stringify(data);
  let encrypted = cipher.update(jsonString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * Déchiffre des données avec AES-256-CBC
 */
export function decryptSensitiveData(encrypted: string, ivHex: string): any {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

/**
 * Génère une signature HMAC-SHA256 pour authentifier l'origine d'un message
 */
export function generateMessageSignature(message: any, secret?: string): string {
  const signingKey = secret || process.env.KAFKA_SIGNING_SECRET || 'wanzo-default-signing-secret-change-in-prod';
  
  const messageString = typeof message === 'string' ? message : JSON.stringify(message);
  
  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(messageString);
  
  return hmac.digest('hex');
}

/**
 * Vérifie la signature HMAC d'un message
 */
export function verifyMessageSignature(message: any, signature: string, secret?: string): boolean {
  const expectedSignature = generateMessageSignature(message, secret);
  
  // Comparaison temporelle constante pour éviter les timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Chiffre les informations de paiement (bankAccounts, mobileMoneyAccounts)
 * pour transmission sécurisée via Kafka
 */
export function encryptPaymentInfo(paymentInfo: any): {
  encryptedData: string;
  iv: string;
  signature: string;
} {
  if (!paymentInfo) {
    return { encryptedData: '', iv: '', signature: '' };
  }
  
  // Chiffrer les données sensibles
  const { encrypted, iv } = encryptSensitiveData(paymentInfo);
  
  // Signer le message chiffré pour authentification
  const signature = generateMessageSignature(encrypted);
  
  return {
    encryptedData: encrypted,
    iv,
    signature,
  };
}

/**
 * Déchiffre les informations de paiement reçues via Kafka
 */
export function decryptPaymentInfo(
  encryptedData: string,
  iv: string,
  signature: string
): any {
  if (!encryptedData || !iv) {
    return null;
  }
  
  // Vérifier la signature avant de déchiffrer
  if (!verifyMessageSignature(encryptedData, signature)) {
    throw new Error('Invalid message signature - possible tampering detected');
  }
  
  // Déchiffrer les données
  return decryptSensitiveData(encryptedData, iv);
}

/**
 * Chiffre un message Kafka complet avec métadonnées de sécurité
 */
export function secureKafkaMessage(message: any, sourceService: string): {
  data: any;
  security: {
    encrypted: boolean;
    iv?: string;
    signature: string;
    timestamp: string;
    source: string;
  };
} {
  // Identifier les champs sensibles à chiffrer
  const sensitiveFields = ['paymentInfo', 'payment_info', 'bankAccount', 'mobileMoneyAccount'];
  
  const securedMessage: any = { ...message };
  let encryptionApplied = false;
  let iv: string | undefined;
  
  // Chiffrer les champs sensibles
  for (const field of sensitiveFields) {
    if (securedMessage[field]) {
      const { encrypted, iv: fieldIv } = encryptSensitiveData(securedMessage[field]);
      securedMessage[field] = encrypted;
      iv = fieldIv;
      encryptionApplied = true;
    }
  }
  
  // Générer signature du message complet
  const signature = generateMessageSignature(securedMessage);
  
  return {
    data: securedMessage,
    security: {
      encrypted: encryptionApplied,
      iv,
      signature,
      timestamp: new Date().toISOString(),
      source: sourceService,
    },
  };
}

/**
 * Vérifie et déchiffre un message Kafka sécurisé
 */
export function unsecureKafkaMessage(securedMessage: any): any {
  if (!securedMessage.security) {
    // Message non sécurisé (ancien format) - laisser passer pour compatibilité
    return securedMessage.data || securedMessage;
  }
  
  const { data, security } = securedMessage;
  
  // Vérifier la signature
  if (!verifyMessageSignature(data, security.signature)) {
    throw new Error(
      `Invalid Kafka message signature from ${security.source} - possible tampering`
    );
  }
  
  // Déchiffrer les champs sensibles si nécessaire
  if (security.encrypted && security.iv) {
    const sensitiveFields = ['paymentInfo', 'payment_info', 'bankAccount', 'mobileMoneyAccount'];
    
    const unsecuredData: any = { ...data };
    
    for (const field of sensitiveFields) {
      if (typeof unsecuredData[field] === 'string') {
        try {
          unsecuredData[field] = decryptSensitiveData(unsecuredData[field], security.iv);
        } catch (error) {
          // Champ pas chiffré ou erreur de déchiffrement - laisser tel quel
        }
      }
    }
    
    return unsecuredData;
  }
  
  return data;
}

/**
 * Hash une valeur sensible (pour logging sans exposer les données réelles)
 */
export function hashSensitiveValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
}
