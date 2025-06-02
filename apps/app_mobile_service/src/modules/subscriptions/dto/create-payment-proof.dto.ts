import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePaymentProofDto {
  // userId will be taken from the authenticated user context

  @IsNotEmpty()
  @IsString()
  fileUrl: string; // This will be the URL after upload to a service like Cloudinary

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionTierId?: string;

  @IsOptional()
  @IsUUID()
  tokenPackageId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
