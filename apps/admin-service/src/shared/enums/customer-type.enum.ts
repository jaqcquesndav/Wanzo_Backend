/**
 * @deprecated Use CustomerDetailedProfile enums instead
 * Customer Type Enum - Use ProfileType, AdminStatus, ComplianceRating from CustomerDetailedProfile entity
 */
export enum CustomerType {
  PME = 'pme',
  FINANCIAL = 'financial',
}

// For backward compatibility
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  NEEDS_VALIDATION = 'needs_validation',
  VALIDATION_IN_PROGRESS = 'validation_in_progress'
}

export enum AccountType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}
