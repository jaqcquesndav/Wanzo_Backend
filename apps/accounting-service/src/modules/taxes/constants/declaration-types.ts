import { DeclarationType, DeclarationPeriodicity } from "../entities/tax-declaration.entity";

// Cette constante suit la structure définie dans l'API-DOCUMENTATION
// tout en utilisant les énumérations TypeScript pour la compatibilité avec TypeORM
export const DECLARATION_TYPES = {
  IPR: {
    label: 'Impôt sur le Revenu Professionnel',
    periodicity: DeclarationPeriodicity.MONTHLY, // 'monthly' dans la doc
    dueDate: 15 // Jour du mois suivant
  },
  IB: {
    label: 'Impôt sur les Bénéfices',
    periodicity: DeclarationPeriodicity.ANNUAL, // 'annual' dans la doc
    dueDate: 31 // Mars de l'année suivante
  },
  TVA: {
    label: 'Taxe sur la Valeur Ajoutée',
    periodicity: DeclarationPeriodicity.MONTHLY, // 'monthly' dans la doc
    dueDate: 15 // Jour du mois suivant
  },
  CNSS: {
    label: 'Cotisations CNSS',
    periodicity: DeclarationPeriodicity.MONTHLY, // 'monthly' dans la doc
    dueDate: 10 // Jour du mois suivant
  },
  TPI: {
    label: 'Taxe de Promotion de l\'Industrie',
    periodicity: DeclarationPeriodicity.MONTHLY, // 'monthly' dans la doc
    dueDate: 15 // Jour du mois suivant
  },
  TE: {
    label: 'Taxe Environnementale',
    periodicity: DeclarationPeriodicity.QUARTERLY, // 'quarterly' dans la doc
    dueDate: 15 // Jour du premier mois du trimestre suivant
  }
};
