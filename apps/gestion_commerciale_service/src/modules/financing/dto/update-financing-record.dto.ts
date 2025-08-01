import { PartialType } from '@nestjs/swagger'; // Using @nestjs/swagger for PartialType as it works well with ApiProperty
import { CreateFinancingRecordDto } from './create-financing-record.dto';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FinancingRequestStatus } from '../entities/financing-record.entity';

export class UpdateFinancingRecordDto extends PartialType(CreateFinancingRecordDto) {
  @ApiPropertyOptional({
    description: 'Statut de la demande',
    enum: FinancingRequestStatus,
  })
  @IsEnum(FinancingRequestStatus)
  @IsOptional()
  status?: FinancingRequestStatus;

  @ApiPropertyOptional({ 
    description: 'Date de soumission',
    example: '2023-08-01T12:30:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  applicationDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Date de mise à jour de statut',
    example: '2023-08-02T10:15:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  lastStatusUpdateDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Date d\'approbation',
    example: '2023-08-15T14:20:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  approvalDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Date de décaissement',
    example: '2023-08-20T09:45:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  disbursementDate?: Date;
}
