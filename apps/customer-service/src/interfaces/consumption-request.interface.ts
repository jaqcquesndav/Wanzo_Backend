import { BusinessFeature } from '../../../../packages/shared/src/enums/business-features.enum';

/**
 * Interface pour les requêtes de consommation de fonctionnalités
 */
export interface ConsumptionRequest {
  /** ID du client */
  customerId: string;
  
  /** ID de l'utilisateur (optionnel) */
  userId?: string;
  
  /** Fonctionnalité à consommer */
  feature: BusinessFeature;
  
  /** Montant à consommer */
  amount: number;
  
  /** Nom du service qui fait la demande */
  serviceName: string;
  
  /** Type d'action effectuée */
  actionType: string;
  
  /** ID de la ressource affectée (optionnel) */
  resourceId?: string;
  
  /** Contexte additionnel (optionnel) */
  context?: Record<string, any>;
}