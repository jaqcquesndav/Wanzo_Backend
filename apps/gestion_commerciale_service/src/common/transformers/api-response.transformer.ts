import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Classe utilitaire pour transformer les réponses en format ApiResponse<T>
 * compatible avec les attentes du frontend Flutter.
 */
export class ApiResponseTransformer {
  /**
   * Transforme une entité ou un DTO en réponse API standard
   * @param data Les données à inclure dans la réponse
   * @param message Message de succès
   * @param statusCode Code HTTP (défaut: 200)
   * @returns Une réponse API formatée
   */
  static transform<T>(
    data: T,
    message: string = 'Opération réussie',
    statusCode: number = 200
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      statusCode
    };
  }

  /**
   * Transforme un résultat paginé en réponse API standard avec pagination
   * @param result Résultat paginé avec data, total, page et limit
   * @param message Message de succès
   * @param statusCode Code HTTP (défaut: 200)
   * @returns Une réponse API formatée avec métadonnées de pagination
   */
  static transformPaginated<T>(
    result: { data: T[], total: number, page: number, limit: number },
    message: string = 'Opération réussie',
    statusCode: number = 200
  ): ApiResponse<T[]> & { pagination: { total: number, page: number, limit: number } } {
    return {
      success: true,
      message,
      data: result.data,
      statusCode,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    };
  }

  /**
   * Crée une réponse d'erreur
   * @param message Message d'erreur
   * @param statusCode Code HTTP d'erreur (défaut: 400)
   * @param error Détails supplémentaires de l'erreur (optionnel)
   * @returns Une réponse API d'erreur
   */
  static error<T>(
    message: string = 'Une erreur est survenue',
    statusCode: number = 400,
    error?: string
  ): ApiResponse<T> {
    return {
      success: false,
      message,
      data: null,
      statusCode,
      error
    };
  }
}
