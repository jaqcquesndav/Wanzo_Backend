import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  Matches,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'matchPassword', async: false })
export class MatchPassword implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    return text === (args.object as any)[args.constraints[0]];
  }

  defaultMessage(args: ValidationArguments) {
    return 'Passwords do not match.';
  }
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The user\'s current password',
    example: 'currentPassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'The new password for the user',
    example: 'newSecurePassword456',
    minLength: 8,
    pattern: '/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',
  })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. It must contain at least one uppercase letter, one lowercase letter, and one number or special character.',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm the new password',
    example: 'newSecurePassword456',
  })
  @IsString()
  @Validate(MatchPassword, ['newPassword'], {
    message: 'Passwords do not match',
  })
  confirmPassword: string;
}
