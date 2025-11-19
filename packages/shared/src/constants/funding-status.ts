/**
 * Statuts standardisés pour les demandes de financement
 * Alignement entre gestion_commerciale (FinancingRequestStatus) 
 * et portfolio-institution (FundingRequestStatus)
 */

export enum StandardFundingStatus {
  // Statut initial - brouillon non soumis
  DRAFT = 'draft',
  
  // Soumis pour traitement
  SUBMITTED = 'submitted',
  
  // En cours d'analyse
  UNDER_REVIEW = 'under_review',
  
  // En attente (équivalent à PENDING dans portfolio)
  PENDING = 'pending',
  
  // Approuvé
  APPROVED = 'approved',
  
  // Rejeté
  REJECTED = 'rejected',
  
  // Décaissé (fonds transférés)
  DISBURSED = 'disbursed',
  
  // Complété (tous remboursements effectués)
  COMPLETED = 'completed',
  
  // Annulé (orthographe standardisée)
  CANCELED = 'canceled',
  
  // Restructuré (contrat modifié)
  RESTRUCTURED = 'restructured',
  
  // En litige
  IN_LITIGATION = 'in_litigation',
  
  // Défaillant
  DEFAULTED = 'defaulted'
}

/**
 * Mapper les anciens statuts de gestion_commerciale vers les nouveaux standards
 */
export function mapGestionCommercialeStatus(oldStatus: string): StandardFundingStatus {
  const mapping: Record<string, StandardFundingStatus> = {
    'draft': StandardFundingStatus.DRAFT,
    'submitted': StandardFundingStatus.SUBMITTED,
    'underReview': StandardFundingStatus.UNDER_REVIEW,
    'approved': StandardFundingStatus.APPROVED,
    'rejected': StandardFundingStatus.REJECTED,
    'disbursed': StandardFundingStatus.DISBURSED,
    'completed': StandardFundingStatus.COMPLETED,
    'cancelled': StandardFundingStatus.CANCELED, // Correction orthographe
  };
  
  return mapping[oldStatus] || StandardFundingStatus.PENDING;
}

/**
 * Mapper les anciens statuts de portfolio vers les nouveaux standards
 */
export function mapPortfolioStatus(oldStatus: string): StandardFundingStatus {
  const mapping: Record<string, StandardFundingStatus> = {
    'pending': StandardFundingStatus.PENDING,
    'under_review': StandardFundingStatus.UNDER_REVIEW,
    'approved': StandardFundingStatus.APPROVED,
    'rejected': StandardFundingStatus.REJECTED,
    'canceled': StandardFundingStatus.CANCELED,
    'disbursed': StandardFundingStatus.DISBURSED,
  };
  
  return mapping[oldStatus] || StandardFundingStatus.PENDING;
}

/**
 * Mapper vers le format gestion_commerciale (pour rétro-compatibilité)
 */
export function toGestionCommercialeFormat(status: StandardFundingStatus): string {
  const mapping: Record<StandardFundingStatus, string> = {
    [StandardFundingStatus.DRAFT]: 'draft',
    [StandardFundingStatus.SUBMITTED]: 'submitted',
    [StandardFundingStatus.UNDER_REVIEW]: 'underReview',
    [StandardFundingStatus.PENDING]: 'underReview',
    [StandardFundingStatus.APPROVED]: 'approved',
    [StandardFundingStatus.REJECTED]: 'rejected',
    [StandardFundingStatus.DISBURSED]: 'disbursed',
    [StandardFundingStatus.COMPLETED]: 'completed',
    [StandardFundingStatus.CANCELED]: 'cancelled',
    [StandardFundingStatus.RESTRUCTURED]: 'underReview',
    [StandardFundingStatus.IN_LITIGATION]: 'underReview',
    [StandardFundingStatus.DEFAULTED]: 'rejected',
  };
  
  return mapping[status];
}

/**
 * Mapper vers le format portfolio (pour rétro-compatibilité)
 */
export function toPortfolioFormat(status: StandardFundingStatus): string {
  const mapping: Record<StandardFundingStatus, string> = {
    [StandardFundingStatus.DRAFT]: 'pending',
    [StandardFundingStatus.SUBMITTED]: 'pending',
    [StandardFundingStatus.UNDER_REVIEW]: 'under_review',
    [StandardFundingStatus.PENDING]: 'pending',
    [StandardFundingStatus.APPROVED]: 'approved',
    [StandardFundingStatus.REJECTED]: 'rejected',
    [StandardFundingStatus.DISBURSED]: 'disbursed',
    [StandardFundingStatus.COMPLETED]: 'disbursed',
    [StandardFundingStatus.CANCELED]: 'canceled',
    [StandardFundingStatus.RESTRUCTURED]: 'approved',
    [StandardFundingStatus.IN_LITIGATION]: 'under_review',
    [StandardFundingStatus.DEFAULTED]: 'rejected',
  };
  
  return mapping[status];
}

/**
 * Vérifier si un statut permet la modification
 */
export function isModifiable(status: StandardFundingStatus): boolean {
  return [
    StandardFundingStatus.DRAFT,
    StandardFundingStatus.PENDING,
    StandardFundingStatus.UNDER_REVIEW,
  ].includes(status);
}

/**
 * Vérifier si un statut est terminal (ne peut plus changer)
 */
export function isTerminal(status: StandardFundingStatus): boolean {
  return [
    StandardFundingStatus.COMPLETED,
    StandardFundingStatus.CANCELED,
    StandardFundingStatus.REJECTED,
    StandardFundingStatus.DEFAULTED,
  ].includes(status);
}

/**
 * Obtenir les transitions valides depuis un statut donné
 */
export function getValidTransitions(currentStatus: StandardFundingStatus): StandardFundingStatus[] {
  const transitions: Record<StandardFundingStatus, StandardFundingStatus[]> = {
    [StandardFundingStatus.DRAFT]: [
      StandardFundingStatus.SUBMITTED,
      StandardFundingStatus.CANCELED,
    ],
    [StandardFundingStatus.SUBMITTED]: [
      StandardFundingStatus.UNDER_REVIEW,
      StandardFundingStatus.CANCELED,
    ],
    [StandardFundingStatus.PENDING]: [
      StandardFundingStatus.UNDER_REVIEW,
      StandardFundingStatus.CANCELED,
    ],
    [StandardFundingStatus.UNDER_REVIEW]: [
      StandardFundingStatus.APPROVED,
      StandardFundingStatus.REJECTED,
      StandardFundingStatus.CANCELED,
    ],
    [StandardFundingStatus.APPROVED]: [
      StandardFundingStatus.DISBURSED,
      StandardFundingStatus.CANCELED,
    ],
    [StandardFundingStatus.DISBURSED]: [
      StandardFundingStatus.COMPLETED,
      StandardFundingStatus.RESTRUCTURED,
      StandardFundingStatus.IN_LITIGATION,
      StandardFundingStatus.DEFAULTED,
    ],
    [StandardFundingStatus.RESTRUCTURED]: [
      StandardFundingStatus.COMPLETED,
      StandardFundingStatus.IN_LITIGATION,
      StandardFundingStatus.DEFAULTED,
    ],
    [StandardFundingStatus.IN_LITIGATION]: [
      StandardFundingStatus.COMPLETED,
      StandardFundingStatus.DEFAULTED,
    ],
    [StandardFundingStatus.REJECTED]: [],
    [StandardFundingStatus.CANCELED]: [],
    [StandardFundingStatus.COMPLETED]: [],
    [StandardFundingStatus.DEFAULTED]: [],
  };
  
  return transitions[currentStatus] || [];
}
