import { IsString, IsEnum, IsBoolean, IsOptional, IsArray, ValidateNested, IsObject, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StepType, StepStatus } from '../entities/workflow-step.entity';
import { WorkflowType, WorkflowStatus } from '../entities/workflow.entity';

class FileDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Cloudinary URL' })
  @IsString()
  cloudinaryUrl!: string;

  @ApiProperty({ description: 'File type' })
  @IsString()
  type!: string;
}

class WorkflowStepDto {
  @ApiProperty({ description: 'Step type', enum: StepType })
  @IsEnum(StepType)
  stepType!: StepType;

  @ApiProperty({ description: 'Step label' })
  @IsString()
  label!: string;

  @ApiPropertyOptional({ description: 'Step description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Assigned to user/role' })
  @IsString()
  assignedTo!: string;

  @ApiProperty({ description: 'External application' })
  @IsString()
  externalApp!: string;

  @ApiProperty({ description: 'Requires validation token' })
  @IsBoolean()
  requiresValidationToken!: boolean;

  @ApiPropertyOptional({ description: 'Required files', type: [FileDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];

  @ApiPropertyOptional({ description: 'Evaluation criteria' })
  @IsOptional()
  @IsObject()
  evaluationCriteria?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Workflow name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Workflow type', enum: WorkflowType })
  @IsEnum(WorkflowType)
  type!: WorkflowType;

  @ApiProperty({ description: 'Operation ID' })
  @IsUUID()
  operationId!: string;

  @ApiProperty({ description: 'Workflow steps', type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps!: WorkflowStepDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({ description: 'Workflow status', enum: WorkflowStatus })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiPropertyOptional({ description: 'Current step ID' })
  @IsOptional()
  @IsUUID()
  currentStepId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateWorkflowStepDto {
  @ApiPropertyOptional({ description: 'Step status', enum: StepStatus })
  @IsOptional()
  @IsEnum(StepStatus)
  status?: StepStatus;

  @ApiPropertyOptional({ description: 'Files', type: [FileDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ManagerValidationDto {
  @ApiProperty({ description: 'Validation status', enum: StepStatus })
  @IsEnum(StepStatus)
  status!: StepStatus;

  @ApiProperty({ description: 'Validation comment' })
  @IsString()
  comment!: string;
}

export class SystemCheckDto {
  @ApiProperty({ description: 'Check status', enum: StepStatus })
  @IsEnum(StepStatus)
  status!: StepStatus;

  @ApiProperty({ description: 'Check date' })
  @IsString()
  checkedAt!: string;

  @ApiProperty({ description: 'Check result' })
  @IsString()
  result!: string;
}