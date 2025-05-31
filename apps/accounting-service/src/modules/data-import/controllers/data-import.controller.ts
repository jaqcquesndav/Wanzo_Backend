import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataImportService } from '../services/data-import.service';
import { ImportJournalDataDto, ImportResultDto } from '../dtos/data-import.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('data-import')
@Controller('data-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('journals')
  @Roles('admin', 'accountant')
  @ApiOperation({ 
    summary: 'Import historical journal entries',
    description: 'Import journal entries for a specific fiscal year. This is intended for importing historical data for companies that are migrating to the system.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Journal entries imported successfully',
    type: ImportResultDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async importJournalData(
    @Body() data: ImportJournalDataDto,
    @Req() req: any,
  ): Promise<ImportResultDto> {
    return await this.dataImportService.importJournalData(
      req.user.companyId,
      req.user.id,
      data,
    );
  }
}