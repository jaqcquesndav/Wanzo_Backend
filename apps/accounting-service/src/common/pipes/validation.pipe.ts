import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    console.log('📝 VALIDATION PIPE - Incoming value:', JSON.stringify(value, null, 2));
    console.log('📝 VALIDATION PIPE - Metatype:', metatype?.name);
    
    if (!metatype || !this.toValidate(metatype)) {
      console.log('📝 VALIDATION PIPE - Skipping validation (no metatype or not validatable)');
      return value;
    }

    const object = plainToClass(metatype, value);
    console.log('📝 VALIDATION PIPE - Transformed object:', JSON.stringify(object, null, 2));
    
    const errors = await validate(object);
    console.log('📝 VALIDATION PIPE - Validation errors:', errors);

    if (errors.length > 0) {
      const messages = errors.map(error => ({
        field: error.property,
        constraints: error.constraints,
      }));

      console.log('📝 VALIDATION PIPE - Formatted error messages:', JSON.stringify(messages, null, 2));

      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }

    console.log('📝 VALIDATION PIPE - Validation passed');
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
