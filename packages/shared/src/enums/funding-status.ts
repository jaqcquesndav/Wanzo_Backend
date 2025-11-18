/**
 * Enums standardisés pour les statuts de financement
 * Utilisés par gestion_commerciale et portfolio-institution
 */

export enum StandardFundingStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const mapGestionCommercialeToStandard = (status: string): StandardFundingStatus => {
  const mapping: Record<string, StandardFundingStatus> = {
    'draft': StandardFundingStatus.DRAFT,
    'submitted': StandardFundingStatus.SUBMITTED,
    'underReview': StandardFundingStatus.UNDER_REVIEW,
    'approved': StandardFundingStatus.APPROVED,
    'rejected': StandardFundingStatus.REJECTED,
    'disbursed': StandardFundingStatus.DISBURSED,
    'completed': StandardFundingStatus.COMPLETED,
    'cancelled': StandardFundingStatus.CANCELLED,
  };
  return mapping[status] || StandardFundingStatus.PENDING;
};

export const mapPortfolioToStandard = (status: string): StandardFundingStatus => {
  const mapping: Record<string, StandardFundingStatus> = {
    'pending': StandardFundingStatus.PENDING,
    'under_review': StandardFundingStatus.UNDER_REVIEW,
    'approved': StandardFundingStatus.APPROVED,
    'rejected': StandardFundingStatus.REJECTED,
    'canceled': StandardFundingStatus.CANCELLED,
    'cancelled': StandardFundingStatus.CANCELLED,
    'disbursed': StandardFundingStatus.DISBURSED,
  };
  return mapping[status] || StandardFundingStatus.PENDING;
};

export const mapStandardToGestionCommerciale = (status: StandardFundingStatus): string => {
  const mapping: Record<StandardFundingStatus, string> = {
    [StandardFundingStatus.DRAFT]: 'draft',
    [StandardFundingStatus.SUBMITTED]: 'submitted',
    [StandardFundingStatus.PENDING]: 'submitted',
    [StandardFundingStatus.UNDER_REVIEW]: 'underReview',
    [StandardFundingStatus.APPROVED]: 'approved',
    [StandardFundingStatus.REJECTED]: 'rejected',
    [StandardFundingStatus.DISBURSED]: 'disbursed',
    [StandardFundingStatus.COMPLETED]: 'completed',
    [StandardFundingStatus.CANCELLED]: 'cancelled',
  };
  return mapping[status];
};

export const mapStandardToPortfolio = (status: StandardFundingStatus): string => {
  const mapping: Record<StandardFundingStatus, string> = {
    [StandardFundingStatus.DRAFT]: 'pending',
    [StandardFundingStatus.SUBMITTED]: 'pending',
    [StandardFundingStatus.PENDING]: 'pending',
    [StandardFundingStatus.UNDER_REVIEW]: 'under_review',
    [StandardFundingStatus.APPROVED]: 'approved',
    [StandardFundingStatus.REJECTED]: 'rejected',
    [StandardFundingStatus.DISBURSED]: 'disbursed',
    [StandardFundingStatus.COMPLETED]: 'disbursed',
    [StandardFundingStatus.CANCELLED]: 'canceled',
  };
  return mapping[status];
};
