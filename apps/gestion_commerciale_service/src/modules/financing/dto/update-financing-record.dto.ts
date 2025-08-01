import { PartialType } from '@nestjs/swagger'; // Using @nestjs/swagger for PartialType as it works well with ApiProperty
import { CreateFinancingRecordDto } from './create-financing-record.dto';

export class UpdateFinancingRecordDto extends PartialType(CreateFinancingRecordDto) {}
