export interface ServiceResponse {
  status: number;
  headers: Record<string, string | string[]>;
  data: any;
}

export interface ServiceError {
  status: number;
  message: string;
  error?: any;
}

export interface ServiceConfig {
  url: string;
  timeout?: number;
  retries?: number;
}