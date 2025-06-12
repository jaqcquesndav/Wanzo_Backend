/**
 * Enumération des catégories de dépenses, correspondant exactement à celles du frontend.
 * Ces valeurs sont utilisées pour mapper les catégories personnalisées du backend
 * vers les types de catégories standards utilisés par le frontend Flutter.
 */
export enum ExpenseCategoryEnum {
  RENT = 'rent',           // Loyer
  UTILITIES = 'utilities', // Services Publics
  SUPPLIES = 'supplies',   // Fournitures
  SALARIES = 'salaries',   // Salaires
  MARKETING = 'marketing', // Marketing
  TRANSPORT = 'transport', // Transport
  MAINTENANCE = 'maintenance', // Maintenance
  OTHER = 'other',         // Autre
}

/**
 * Table de correspondance entre les noms de catégories en français
 * et les valeurs de l'enum ExpenseCategoryEnum.
 * Utilisée pour la conversion entre les catégories personnalisées
 * et les catégories standards.
 */
export const CATEGORY_NAME_TO_ENUM_MAP = {
  'Loyer': ExpenseCategoryEnum.RENT,
  'Services Publics': ExpenseCategoryEnum.UTILITIES,
  'Fournitures': ExpenseCategoryEnum.SUPPLIES, 
  'Salaires': ExpenseCategoryEnum.SALARIES,
  'Marketing': ExpenseCategoryEnum.MARKETING,
  'Transport': ExpenseCategoryEnum.TRANSPORT,
  'Maintenance': ExpenseCategoryEnum.MAINTENANCE,
  'Autre': ExpenseCategoryEnum.OTHER,
};
