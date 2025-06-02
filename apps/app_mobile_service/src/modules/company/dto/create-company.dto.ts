import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  // Note: userId (creator) will be passed as a separate argument to the companyService.create method
  // by the AuthController or CompanyController, extracted from the authenticated user.
}
