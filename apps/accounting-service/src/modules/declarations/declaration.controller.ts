import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TaxService } from '../taxes/services/tax.service';
import { CreateTaxDeclarationDto, UpdateTaxDeclarationDto, UpdateTaxDeclarationStatusDto, TaxFilterDto } from '../taxes/dtos/tax.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Declarations')
@Controller('declarations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeclarationController {
  constructor(private readonly taxService: TaxService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tax declaration' })
  @ApiResponse({ status: 201, description: 'Declaration created successfully' })
  async create(@Body() createDeclarationDto: CreateTaxDeclarationDto, @Req() req: Request) {
    try {
      const userId = (req.user as any).sub;
      const declaration = await this.taxService.create(createDeclarationDto, userId);
      return {
        success: true,
        data: declaration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create declaration'
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all tax declarations' })
  @ApiResponse({ status: 200, description: 'Declarations retrieved successfully' })
  async findAll(@Query() query: TaxFilterDto, @Req() req: Request) {
    try {
      const result = await this.taxService.findAll(query);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get declarations'
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tax declaration' })
  @ApiResponse({ status: 200, description: 'Declaration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Declaration not found' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try {
      const declaration = await this.taxService.findById(id);
      return {
        success: true,
        data: declaration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get declaration'
      };
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax declaration' })
  @ApiResponse({ status: 200, description: 'Declaration updated successfully' })
  @ApiResponse({ status: 404, description: 'Declaration not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDeclarationDto: UpdateTaxDeclarationDto,
    @Req() req: Request
  ) {
    try {
      const userId = (req.user as any).sub;
      const declaration = await this.taxService.update(id, updateDeclarationDto, userId);
      return {
        success: true,
        data: declaration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update declaration'
      };
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update declaration status' })
  @ApiResponse({ status: 200, description: 'Declaration status updated successfully' })
  @ApiResponse({ status: 404, description: 'Declaration not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTaxDeclarationStatusDto,
    @Req() req: Request
  ) {
    try {
      const userId = (req.user as any).sub;
      const declaration = await this.taxService.updateStatus(id, updateStatusDto, userId);
      return {
        success: true,
        data: declaration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update declaration status'
      };
    }
  }
}
