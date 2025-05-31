import { HttpException, HttpStatus } from '@nestjs/common';

export class DomainException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class ResourceNotFoundException extends DomainException {
  constructor(resource: string) {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ValidationException extends DomainException {
  constructor(errors: Record<string, string[]>) {
    super('Validation failed', HttpStatus.BAD_REQUEST);
    // Set the response object with the validation errors
    Object.defineProperty(this, 'response', {
      value: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors,
      },
      enumerable: true,
    });
  }
}

export class AuthorizationException extends DomainException {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}