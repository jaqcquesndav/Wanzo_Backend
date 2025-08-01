import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Interceptor that transforms all successful responses into the standard ApiResponse format
 * expected by the frontend.
 */
@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the response is already in ApiResponse format, return it as is
        if (data && typeof data === 'object' && 'success' in data && 'message' in data && 'data' in data && 'statusCode' in data) {
          return data as ApiResponse<T>;
        }

        // Get HTTP status from the response
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const statusCode = response.statusCode || HttpStatus.OK;

        // Format response in the standard structure
        return {
          success: true,
          message: 'Operation successful',
          data,
          statusCode,
        } as ApiResponse<T>;
      }),
    );
  }
}
