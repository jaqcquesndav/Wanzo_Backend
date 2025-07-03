import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API response format for all endpoints
 * @template T The type of data being returned
 */
export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Status of the response', example: 'success' })
  status!: string;

  @ApiProperty({ description: 'Response message', example: 'Operation completed successfully' })
  message!: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: T;

  @ApiProperty({ description: 'Timestamp of the response', example: '2023-01-01T12:00:00.000Z' })
  timestamp!: string;

  constructor(partial?: Partial<ApiResponseDto<T>>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

/**
 * Error response format
 */
export class ApiErrorResponseDto {
  @ApiProperty({ description: 'Status of the response', example: 'error' })
  status!: string;

  @ApiProperty({ description: 'Error message', example: 'An error occurred' })
  message!: string;

  @ApiProperty({ description: 'Error code', example: 'ERR_VALIDATION_FAILED' })
  code!: string;

  @ApiProperty({ description: 'Timestamp of the error', example: '2023-01-01T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ description: 'Detailed error information', required: false })
  details?: any;

  constructor(partial?: Partial<ApiErrorResponseDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
