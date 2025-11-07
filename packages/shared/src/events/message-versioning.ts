/**
 * Interface pour le versioning des messages Kafka
 * Assure la compatibilité ascendante/descendante entre services
 */

export interface MessageVersion {
  version: string;
  schemaVersion: string;
  compatibleVersions: string[];
}

export interface StandardMessageMetadata {
  id: string;
  correlationId: string;
  timestamp: string;
  source: string;
  version: MessageVersion;
  retryCount: number;
  processingMetadata?: {
    receivedAt?: string;
    processedAt?: string;
    processingDuration?: number;
    consumerVersion?: string;
  };
}

export interface StandardKafkaMessage<T = any> {
  id: string;
  eventType: string;
  data: T;
  metadata: StandardMessageMetadata;
}

export class MessageVersionManager {
  private static readonly CURRENT_VERSION = '2.0.0';
  private static readonly SCHEMA_VERSIONS = {
    'commerce.operation': 'v1.2.0',
    'accounting.journal': 'v1.1.0',
    'portfolio.analysis': 'v1.0.0',
    'user.events': 'v1.3.0',
    'token.events': 'v1.1.0',
  } as const;

  /**
   * Crée un message standardisé avec versioning
   */
  static createStandardMessage<T>(
    eventType: string,
    data: T,
    source: string,
    correlationId?: string
  ): StandardKafkaMessage<T> {
    const messageId = MessageVersionManager.generateMessageId();
    const schemaVersion = MessageVersionManager.getSchemaVersion(eventType);
    
    return {
      id: messageId,
      eventType,
      data,
      metadata: {
        id: messageId,
        correlationId: correlationId || MessageVersionManager.generateCorrelationId(),
        timestamp: new Date().toISOString(),
        source,
        version: {
          version: MessageVersionManager.CURRENT_VERSION,
          schemaVersion,
          compatibleVersions: MessageVersionManager.getCompatibleVersions(schemaVersion),
        },
        retryCount: 0,
      },
    };
  }

  /**
   * Valide la compatibilité d'un message
   */
  static isCompatible(message: StandardKafkaMessage): {
    compatible: boolean;
    reason?: string;
  } {
    if (!message.metadata?.version) {
      return {
        compatible: false,
        reason: 'Message version information missing',
      };
    }

    const messageVersion = message.metadata.version.version;
    const schemaVersion = message.metadata.version.schemaVersion;
    
    // Vérifier si la version du message est compatible
    if (!MessageVersionManager.isVersionCompatible(messageVersion)) {
      return {
        compatible: false,
        reason: `Message version ${messageVersion} is not compatible with current version ${MessageVersionManager.CURRENT_VERSION}`,
      };
    }

    // Vérifier si le schéma est compatible
    const expectedSchema = MessageVersionManager.getSchemaVersion(message.eventType);
    if (!MessageVersionManager.isSchemaCompatible(schemaVersion, expectedSchema)) {
      return {
        compatible: false,
        reason: `Schema version ${schemaVersion} is not compatible with expected ${expectedSchema}`,
      };
    }

    return { compatible: true };
  }

  /**
   * Migre un message vers la version actuelle si nécessaire
   */
  static migrateMessage<T>(message: StandardKafkaMessage<T>): StandardKafkaMessage<T> {
    const compatibility = MessageVersionManager.isCompatible(message);
    
    if (compatibility.compatible) {
      return message;
    }

    // Migration basique - à étendre selon les besoins
    const migratedMessage = { ...message };
    
    // Assurer que les métadonnées sont présentes
    if (!migratedMessage.metadata) {
      migratedMessage.metadata = {
        id: message.id || MessageVersionManager.generateMessageId(),
        correlationId: MessageVersionManager.generateCorrelationId(),
        timestamp: new Date().toISOString(),
        source: 'migration-service',
        version: {
          version: MessageVersionManager.CURRENT_VERSION,
          schemaVersion: MessageVersionManager.getSchemaVersion(message.eventType),
          compatibleVersions: [],
        },
        retryCount: 0,
      };
    }

    // Mettre à jour la version
    migratedMessage.metadata.version.version = MessageVersionManager.CURRENT_VERSION;
    migratedMessage.metadata.version.schemaVersion = MessageVersionManager.getSchemaVersion(message.eventType);

    return migratedMessage;
  }

  /**
   * Obtient la version de schéma pour un type d'événement
   */
  private static getSchemaVersion(eventType: string): string {
    const category = MessageVersionManager.getEventCategory(eventType);
    return MessageVersionManager.SCHEMA_VERSIONS[category] || 'v1.0.0';
  }

  /**
   * Détermine la catégorie d'un événement
   */
  private static getEventCategory(eventType: string): keyof typeof MessageVersionManager.SCHEMA_VERSIONS {
    if (eventType.startsWith('commerce.operation')) return 'commerce.operation';
    if (eventType.startsWith('accounting.journal')) return 'accounting.journal';
    if (eventType.startsWith('portfolio.')) return 'portfolio.analysis';
    if (eventType.startsWith('user.')) return 'user.events';
    if (eventType.startsWith('token.')) return 'token.events';
    
    return 'commerce.operation'; // Default
  }

  /**
   * Vérifie la compatibilité d'une version
   */
  private static isVersionCompatible(version: string): boolean {
    const current = MessageVersionManager.parseVersion(MessageVersionManager.CURRENT_VERSION);
    const message = MessageVersionManager.parseVersion(version);
    
    // Compatible si même version majeure et version mineure >= actuelle - 1
    return current.major === message.major && 
           (current.minor === message.minor || current.minor === message.minor + 1);
  }

  /**
   * Vérifie la compatibilité d'un schéma
   */
  private static isSchemaCompatible(messageSchema: string, expectedSchema: string): boolean {
    const message = MessageVersionManager.parseVersion(messageSchema);
    const expected = MessageVersionManager.parseVersion(expectedSchema);
    
    // Compatible si même version majeure
    return message.major === expected.major;
  }

  /**
   * Parse une version semver
   */
  private static parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.replace('v', '').split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }

  /**
   * Obtient les versions compatibles pour un schéma
   */
  private static getCompatibleVersions(schemaVersion: string): string[] {
    const parsed = MessageVersionManager.parseVersion(schemaVersion);
    const versions: string[] = [];
    
    // Ajouter la version actuelle et les versions mineures précédentes
    for (let minor = Math.max(0, parsed.minor - 1); minor <= parsed.minor; minor++) {
      versions.push(`v${parsed.major}.${minor}.0`);
    }
    
    return versions;
  }

  /**
   * Génère un ID de message unique
   */
  private static generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Génère un ID de corrélation unique
   */
  private static generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Utilitaires pour la conversion de messages
 */
export class MessageConverter {
  /**
   * Convertit un message legacy en message standardisé
   */
  static fromLegacy<T>(
    eventType: string,
    data: T,
    source: string,
    legacyMetadata?: any
  ): StandardKafkaMessage<T> {
    return MessageVersionManager.createStandardMessage(
      eventType,
      data,
      source,
      legacyMetadata?.correlationId
    );
  }

  /**
   * Convertit un message standardisé en format legacy pour compatibilité
   */
  static toLegacy<T>(message: StandardKafkaMessage<T>): T & { metadata?: any } {
    return {
      ...message.data,
      metadata: {
        correlationId: message.metadata.correlationId,
        timestamp: message.metadata.timestamp,
        source: message.metadata.source,
      },
    };
  }
}