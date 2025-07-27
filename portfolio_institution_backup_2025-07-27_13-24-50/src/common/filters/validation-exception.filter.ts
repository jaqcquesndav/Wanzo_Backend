import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationError {
  field: string;
  constraints: Record<string, string>;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const validationErrors = this.extractValidationErrors(exceptionResponse);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Validation failed',
      errors: validationErrors,
    });
  }

  private extractValidationErrors(response: unknown): ValidationError[] {
    if (typeof response === 'string') {
      return [{ field: 'general', constraints: { error: response } }];
    }

    if (typeof response === 'object' && response !== null && 'message' in response) {
      const messages = (response as { message: string | string[] }).message;
      if (Array.isArray(messages)) {
        return messages.map(msg => ({
          field: 'general',
          constraints: { error: msg },
        }));
      }
      return [{ field: 'general', constraints: { error: messages as string } }];
    }

    return [{ field: 'general', constraints: { error: 'Validation failed' } }];
  }
}