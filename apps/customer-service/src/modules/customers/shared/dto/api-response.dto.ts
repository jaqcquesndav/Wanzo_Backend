/**
 * DTOs de réponse API communes
 * Structures unifiées pour toutes les réponses de l'API
 */

export class ApiResponseDto<T> {
  success!: boolean;
  data!: T;
  meta?: Record<string, any>;
}

export class ApiErrorResponseDto {
  success!: boolean;
  error!: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export class PaginationDto {
  page!: number;
  limit!: number;
  total!: number;
  pages!: number;
}

export class PaginationMetaDto {
  pagination!: PaginationDto;
}

/**
 * DTO de réponse avec pagination
 */
export class PaginatedResponseDto<T> extends ApiResponseDto<T[]> {
  meta!: PaginationMetaDto;
}

/**
 * DTO de réponse simple avec message
 */
export class MessageResponseDto {
  message!: string;
}

/**
 * DTO de réponse pour les uploads de fichiers
 */
export class FileUploadResponseDto {
  url!: string;
  message!: string;
  fileName?: string;
  size?: number;
}