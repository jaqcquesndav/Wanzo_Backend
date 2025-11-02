import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ContactRequestDto, MeetingRequestDto, OpportunityFiltersDto } from '../dtos/prospection.dto';
import { ProspectionService } from '../services/prospection.service';

@ApiTags('prospection')
@Controller('prospection')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProspectionController {
  constructor(private readonly prospectionService: ProspectionService) {}

  @Get('opportunities')
  @ApiOperation({ summary: 'Get all prospection opportunities' })
  @ApiQuery({ name: 'status', required: false, enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'] })
  @ApiQuery({ name: 'sector', required: false, description: 'Filter by business sector' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by geographic region' })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Search by name or description' })
  @ApiResponse({ status: 200, description: 'Opportunities retrieved successfully' })
  async getOpportunities(@Query() filters: OpportunityFiltersDto, @Req() req: any) {
    return await this.prospectionService.getOpportunities(filters, req.user.institutionId);
  }

  @Post('contact')
  @Roles('admin', 'portfolio_manager', 'sales_rep')
  @ApiOperation({ summary: 'Initiate contact with a company' })
  @ApiResponse({ status: 200, description: 'Contact initiated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async initiateContact(@Body() contactRequest: ContactRequestDto, @Req() req: any) {
    return await this.prospectionService.initiateContact(contactRequest, req.user.institutionId, req.user.id);
  }

  @Post('meetings')
  @Roles('admin', 'portfolio_manager', 'sales_rep')
  @ApiOperation({ summary: 'Schedule a meeting with a company' })
  @ApiResponse({ status: 201, description: 'Meeting scheduled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid meeting data' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async scheduleMeeting(@Body() meetingRequest: MeetingRequestDto, @Req() req: any) {
    return await this.prospectionService.scheduleMeeting(meetingRequest, req.user.institutionId, req.user.id);
  }
}