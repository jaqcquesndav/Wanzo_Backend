import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  // companyId will be taken from the authenticated user's context
}
