import { IsString, IsOptional, IsUUID, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AdhaContextInfoDto } from './context-info.dto';

export class SendMessageDto {
  @ApiProperty({
    description: 'Texte du message',
    example: 'Je voudrais analyser cette transaction.',
    required: true
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Identifiant de la conversation (optionnel pour une nouvelle conversation)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({
    description: 'Horodatage du message',
    example: '2025-06-04T12:00:00Z',
    format: 'date-time',
    required: true
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Informations contextuelles',
    type: AdhaContextInfoDto,
    required: true
  })
  @ValidateNested()
  @Type(() => AdhaContextInfoDto)
  contextInfo: AdhaContextInfoDto;
}
