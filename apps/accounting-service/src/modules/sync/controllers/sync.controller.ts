import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from '../services/sync.service';
import { SyncRequestDto, SyncResponseDto } from '../dtos/sync.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly syncService: SyncService) {}
  @Post()
  @ApiOperation({ summary: 'Synchronize local data with server' })
  @ApiResponse({ status: 200, description: 'Return sync results and changes', type: SyncResponseDto })
  async sync(@Body() syncRequest: SyncRequestDto, @Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    const syncResponse = await this.syncService.processSyncOperations(
      syncRequest, 
      req.user.companyId,
      req.user.id
    );
    
    return {
      success: true,
      data: syncResponse
    };
  }
}
