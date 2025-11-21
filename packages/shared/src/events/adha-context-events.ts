/**
 * Types et interfaces pour les événements ADHA Context
 * Synchronisation de la base de connaissances entre admin-service et adha-ai-service
 */

export enum AdhaContextType {
  RAPPORT = 'rapport',
  ETUDE = 'etude',
  STATISTIQUE = 'statistique',
  LOI_DECRET = 'loi_decret',
  GUIDE = 'guide',
  PROCEDURE = 'procedure',
  FORMULAIRE = 'formulaire',
  AUTRE = 'autre'
}

export enum ZoneCibleType {
  PAYS = 'pays',
  PROVINCE = 'province',
  VILLE = 'ville',
  ZONE_ECONOMIQUE = 'zone_economique'
}

export interface ZoneCible {
  type: ZoneCibleType;
  value: string;
}

/**
 * Payload de base pour tous les événements ADHA Context
 */
export interface BaseAdhaContextEvent {
  id: string;
  titre: string;
  description?: string;
  type: AdhaContextType;
  url: string;
  downloadUrl?: string;
  coverImageUrl?: string;
  active: boolean;
  canExpire: boolean;
  dateDebut: string;
  dateFin: string;
  domaine?: string[];
  zoneCible?: ZoneCible[];
  niveau?: string;
  tags?: string[];
  timestamp: string;
  version: string; // Pour versioning des événements
}

/**
 * Événement émis lors de la création d'une source ADHA Context
 * Émis UNIQUEMENT si le document est indexable (active=true, url exists, valid dates)
 */
export interface AdhaContextCreatedEvent extends BaseAdhaContextEvent {
  shouldIndex: boolean; // Toujours true pour les events created
  metadata: {
    createdBy?: string;
    createdAt: string;
    sourceService: 'admin-service';
  };
}

/**
 * Événement émis lors de la mise à jour d'une source ADHA Context
 * Émis UNIQUEMENT si les champs d'indexation changent (active, url, dates)
 */
export interface AdhaContextUpdatedEvent extends BaseAdhaContextEvent {
  shouldIndex: boolean; // Indique si le document doit être indexé après l'update
  previouslyIndexable: boolean; // État précédent
  changes: string[]; // Liste des champs modifiés
  metadata: {
    updatedBy?: string;
    updatedAt: string;
    sourceService: 'admin-service';
  };
}

/**
 * Événement émis lors du toggle du statut active
 * Émis UNIQUEMENT si l'éligibilité à l'indexation change
 */
export interface AdhaContextToggledEvent {
  id: string;
  titre: string;
  url: string;
  active: boolean;
  shouldIndex: boolean; // Résultat de la validation complète
  canExpire: boolean;
  dateDebut: string;
  dateFin: string;
  previousState: {
    active: boolean;
    wasIndexable: boolean;
  };
  timestamp: string;
  version: string;
  metadata: {
    toggledBy?: string;
    toggledAt: string;
    sourceService: 'admin-service';
  };
}

/**
 * Événement émis lors de la suppression d'une source ADHA Context
 * Toujours émis pour permettre le nettoyage de l'index
 */
export interface AdhaContextDeletedEvent {
  id: string;
  titre: string;
  url: string;
  type: AdhaContextType;
  timestamp: string;
  version: string;
  metadata: {
    deletedBy?: string;
    deletedAt: string;
    sourceService: 'admin-service';
    reason?: string;
  };
}

/**
 * Événement émis par un job CRON pour les documents expirés
 * Permet de retirer les documents expirés de l'index
 */
export interface AdhaContextExpiredEvent {
  id: string;
  titre: string;
  url: string;
  dateFin: string;
  timestamp: string;
  version: string;
  metadata: {
    expiredAt: string;
    sourceService: 'admin-service' | 'cron-job';
    autoDetected: boolean;
  };
}

/**
 * Topics Kafka pour les événements ADHA Context
 */
export const AdhaContextEventTopics = {
  CONTEXT_CREATED: 'adha.context.created',
  CONTEXT_UPDATED: 'adha.context.updated',
  CONTEXT_DELETED: 'adha.context.deleted',
  CONTEXT_TOGGLED: 'adha.context.toggled',
  CONTEXT_EXPIRED: 'adha.context.expired',
} as const;

/**
 * Helper type pour tous les événements ADHA Context
 */
export type AdhaContextEvent =
  | AdhaContextCreatedEvent
  | AdhaContextUpdatedEvent
  | AdhaContextToggledEvent
  | AdhaContextDeletedEvent
  | AdhaContextExpiredEvent;

/**
 * Constantes pour la validation
 */
export const ADHA_CONTEXT_EVENT_VERSION = '1.0.0';
export const ADHA_CONTEXT_MAX_RETRY = 3;
export const ADHA_CONTEXT_RETRY_DELAY_MS = 5000;
