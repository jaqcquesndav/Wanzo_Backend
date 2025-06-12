import { Type } from 'class-transformer';
import { IsString, IsEnum, IsArray, ValidateNested, IsOptional, IsObject, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SyncOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SyncEntityType {
  ACCOUNT = 'account',
  JOURNAL_ENTRY = 'journalEntry',
  ORGANIZATION = 'organization',
}

class SyncOperationDto {
  @ApiProperty({ enum: SyncOperationType })
  @IsEnum(SyncOperationType)
  type!: SyncOperationType;

  @ApiProperty({ enum: SyncEntityType })
  @IsEnum(SyncEntityType)
  entity!: SyncEntityType;

  @ApiProperty()
  @IsObject()
  data!: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clientId?: string;
}

export class SyncRequestDto {
  @ApiProperty({ type: [SyncOperationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations!: SyncOperationDto[];

  @ApiProperty()
  @IsISO8601()
  lastSyncTimestamp!: string;
}

export class SyncResultDto {
  @ApiProperty()
  @IsString()
  success!: boolean;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clientId?: string;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  serverId?: string;
  
  @ApiProperty()
  @IsString()
  entity!: string;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  error?: string;
}

export class SyncChangeDto {
  @ApiProperty({ enum: SyncOperationType })
  @IsEnum(SyncOperationType)
  type!: SyncOperationType;
  
  @ApiProperty({ enum: SyncEntityType })
  @IsEnum(SyncEntityType)
  entity!: SyncEntityType;
  
  @ApiProperty()
  @IsObject()
  data!: any;
}

export class SyncConflictDto {
  @ApiProperty()
  @IsString()
  entity!: string;
  
  @ApiProperty()
  @IsString()
  id!: string;
  
  @ApiProperty()
  @IsObject()
  serverData!: any;
  
  @ApiProperty()
  @IsObject()
  clientData!: any;
  
  @ApiProperty()
  @IsString()
  resolution!: string;
}

export class SyncResponseDto {
  @ApiProperty()
  @IsISO8601()
  timestamp!: string;
  
  @ApiProperty({ type: [SyncResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncResultDto)
  results!: SyncResultDto[];
  
  @ApiProperty({ type: [SyncChangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncChangeDto)
  changes!: SyncChangeDto[];
  
  @ApiProperty({ type: [SyncConflictDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncConflictDto)
  conflicts!: SyncConflictDto[];
}
