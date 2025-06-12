import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Exception filter that formats all HTTP exceptions according to the ApiResponse structure
 * expected by the frontend.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;
    
    // Prepare error message
    let message = 'An error occurred';
    let error = undefined;
    
    // Extract detailed error information if available
    if (typeof exceptionResponse === 'object') {
      message = exceptionResponse.message || message;
      // For validation errors, include the detailed error information
      if (Array.isArray(exceptionResponse.message)) {
        message = 'Validation failed';
        error = exceptionResponse.message.join(', ');
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    // Format the error response according to ApiResponse structure
    const errorResponse: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      statusCode: status,
      error: error || exception.message,
    };

    response.status(status).json(errorResponse);
  }
}
