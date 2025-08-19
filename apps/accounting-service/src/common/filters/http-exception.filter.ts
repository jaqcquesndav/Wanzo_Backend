import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || null,
      error: exception.name,
    };

    if (status === HttpStatus.UNAUTHORIZED) {
      errorResponse['error'] = 'Unauthorized';
    } else if (status === HttpStatus.FORBIDDEN) {
      errorResponse['error'] = 'Forbidden';
    } else if (status === HttpStatus.NOT_FOUND) {
      errorResponse['error'] = 'Not Found';
    }

    response.status(status).json(errorResponse);
  }
}
