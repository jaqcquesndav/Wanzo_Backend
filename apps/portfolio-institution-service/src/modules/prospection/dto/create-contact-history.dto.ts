import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateContactHistoryDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsString()
  @IsOptional()
  outcome?: string;

  @IsString()
  @IsOptional()
  nextSteps?: string;
}
