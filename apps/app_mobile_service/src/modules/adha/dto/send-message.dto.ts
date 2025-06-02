import { IsString, IsOptional, IsUUID, IsDateString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum InteractionType {
  GENERIC_CARD_ANALYSIS = 'generic_card_analysis',
  DIRECT_INITIATION = 'direct_initiation',
  FOLLOW_UP = 'follow_up',
}

class BaseContextDto {
  // Define structure based on API_DOCUMENTATION.md
  // Example:
  // @ValidateNested()
  // @Type(() => OperationJournalSummaryDto)
  // operationJournalSummary: OperationJournalSummaryDto;

  // @ValidateNested()
  // @Type(() => BusinessProfileDto)
  // businessProfile: BusinessProfileDto;
  // For now, using any to keep it simple, refine later
  operationJournalSummary: any;
  businessProfile: any;
}

class InteractionContextDto {
  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @IsString()
  @IsOptional()
  sourceIdentifier?: string;

  // Define structure based on API_DOCUMENTATION.md
  // For now, using any to keep it simple, refine later
  interactionData?: any;
}

class ContextInfoDto {
  @ValidateNested()
  @Type(() => BaseContextDto)
  baseContext: BaseContextDto;

  @ValidateNested()
  @Type(() => InteractionContextDto)
  interactionContext: InteractionContextDto;
}

export class SendMessageDto {
  @IsString()
  text: string;

  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @IsDateString()
  timestamp: string;

  @ValidateNested()
  @Type(() => ContextInfoDto)
  contextInfo: ContextInfoDto;
}
