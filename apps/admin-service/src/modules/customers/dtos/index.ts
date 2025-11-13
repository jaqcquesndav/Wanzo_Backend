// ===== SYSTÈME PRINCIPAL ADMIN-KYC =====
export * from './admin-customer-profile.dto';
export * from './customer-detailed-profile.dto';
export * from './customer-sync.dto';

// ===== DTOs LEGACY - EN COURS DE DÉPRÉCIATION =====
// ⚠️ Ces DTOs sont maintenus temporairement pour compatibilité
// TODO: Migrer tous les usages vers AdminCustomerProfileDto
export * from './customer-list.dto';       // → À remplacer par AdminCustomerProfileListDto
export * from './customer-details.dto';    // → À remplacer par AdminCustomerProfileDetailsDto  
export * from './customer-response.dto';   // → À remplacer par AdminCustomerProfileDetailsDto
