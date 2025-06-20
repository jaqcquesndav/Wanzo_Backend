import { Controller, Param, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ValidateJournalEntryDto } from '../dtos/chat.dto';

@ApiTags('agent-entries')
@Controller('agent-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AgentEntriesController {
  constructor() {}

  @Put(':entryId/validate')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Validate or modify an AI suggested journal entry' })
  @ApiParam({ name: 'entryId', description: 'The ID of the journal entry to validate' })
  @ApiResponse({ status: 200, description: 'Journal entry validated successfully' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  async validateJournalEntry(
    @Param('entryId') entryId: string,
    @Body() validateDto: ValidateJournalEntryDto,
    @Req() req: any,
  ) {
    // TODO: Implémenter la validation des écritures suggérées
    // Ici nous simulons une réponse positive pour l'exemple
    
    return {
      success: true,
      data: {
        entryId,
        journalId: `J-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: 'validated',
        message: 'Journal entry validated and created successfully',
        timestamp: new Date().toISOString()
      }
    };
  }
}
