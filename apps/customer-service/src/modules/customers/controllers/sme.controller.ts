import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import { SmeService } from '../services/sme.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('smes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('smes')
export class SmeController {
  constructor(private readonly smeService: SmeService) {}

  @ApiOperation({ summary: 'Get all SMEs' })
  @ApiResponse({ status: 200, description: 'Returns all SMEs' })
  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.smeService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Get an SME by ID' })
  @ApiResponse({ status: 200, description: 'Returns the SME' })
  @ApiResponse({ status: 404, description: 'SME not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const sme = await this.smeService.findById(id);
    if (!sme) {
      throw new HttpException('SME not found', HttpStatus.NOT_FOUND);
    }
    return sme;
  }

  @ApiOperation({ summary: 'Create a new SME' })
  @ApiResponse({ status: 201, description: 'SME created successfully' })
  @Post()
  async create(@Body() createSmeDto: any) {
    // Pass a default auth0Id or extract it from the request context
    // In a real application, you would get this from the authenticated user
    const auth0Id = 'auth0|' + Math.random().toString(36).substring(2, 15);
    return this.smeService.create(createSmeDto, auth0Id);
  }

  @ApiOperation({ summary: 'Update an SME' })
  @ApiResponse({ status: 200, description: 'SME updated successfully' })
  @ApiResponse({ status: 404, description: 'SME not found' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSmeDto: any) {
    return this.smeService.update(id, updateSmeDto);
  }

  @ApiOperation({ summary: 'Delete an SME' })
  @ApiResponse({ status: 200, description: 'SME deleted successfully' })
  @ApiResponse({ status: 404, description: 'SME not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.smeService.remove(id);
  }

  @ApiOperation({ summary: 'Validate an SME' })
  @ApiResponse({ status: 200, description: 'SME validated successfully' })
  @ApiResponse({ status: 404, description: 'SME not found' })
  @Put(':id/validate')
  async validate(@Param('id') id: string, @Body() validationDto: { validatedBy: string }) {
    return this.smeService.validate(id, validationDto.validatedBy);
  }

  @ApiOperation({ summary: 'Suspend an SME' })
  @ApiResponse({ status: 200, description: 'SME suspended successfully' })
  @ApiResponse({ status: 404, description: 'SME not found' })
  @Put(':id/suspend')
  async suspend(@Param('id') id: string, @Body() suspensionDto: { suspendedBy: string; reason: string }) {
    return this.smeService.suspend(id, suspensionDto.suspendedBy, suspensionDto.reason);
  }

  @ApiOperation({ summary: 'Reject an SME' })
  @ApiResponse({ status: 200, description: 'SME rejected successfully' })
  @ApiResponse({ status: 404, description: 'SME not found' })
  @Put(':id/reject')
  async reject(@Param('id') id: string, @Body() rejectionDto: { rejectedBy: string; reason: string }) {
    return this.smeService.reject(id, rejectionDto.rejectedBy, rejectionDto.reason);
  }

  @ApiOperation({ summary: 'Get SME-specific business data' })
  @ApiResponse({ status: 200, description: 'Returns SME-specific business data' })
  @ApiResponse({ status: 404, description: 'SME not found' })
  @Get(':id/business-data')
  async getBusinessData(@Param('id') id: string) {
    return this.smeService.getBusinessData(id);
  }
}
