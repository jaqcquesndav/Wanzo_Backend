import { SetMetadata } from '@nestjs/common';

export const SKIP_COMPANY_CHECK_KEY = 'skipCompanyCheck';

/**
 * Décorateur pour marquer une route comme ne nécessitant pas de vérification d'entreprise
 * Utile pour les routes qui ne sont pas liées à une entreprise spécifique
 */
export const SkipCompanyCheck = () => SetMetadata(SKIP_COMPANY_CHECK_KEY, true);
