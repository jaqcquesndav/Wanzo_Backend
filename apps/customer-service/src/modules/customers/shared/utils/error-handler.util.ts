/**
 * Fonction utilitaire pour la gestion robuste des erreurs
 * Évite les erreurs "error of type unknown" 
 */
export function handleControllerError(error: unknown, defaultMessage: string): { message: string; isKnownError: boolean } {
  if (error instanceof Error) {
    return { message: error.message, isKnownError: true };
  }
  
  if (typeof error === 'string') {
    return { message: error, isKnownError: true };
  }
  
  return { message: defaultMessage, isKnownError: false };
}

/**
 * Fonction pour déterminer le status HTTP basé sur le message d'erreur
 */
export function getHttpStatusFromError(errorMessage: string): number {
  if (errorMessage.includes('non trouvé') || errorMessage.includes('non trouvée')) {
    return 404; // NOT_FOUND
  }
  
  if (errorMessage.includes('existe déjà') || errorMessage.includes('déjà existant')) {
    return 409; // CONFLICT
  }
  
  if (errorMessage.includes('contraintes') || errorMessage.includes('contrainte')) {
    return 409; // CONFLICT
  }
  
  if (errorMessage.includes('non autorisé') || errorMessage.includes('unauthorized')) {
    return 401; // UNAUTHORIZED
  }
  
  if (errorMessage.includes('interdit') || errorMessage.includes('forbidden')) {
    return 403; // FORBIDDEN
  }
  
  return 400; // BAD_REQUEST par défaut
}