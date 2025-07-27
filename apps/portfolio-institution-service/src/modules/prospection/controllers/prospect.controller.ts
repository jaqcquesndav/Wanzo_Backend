import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ProspectService } from '../services/prospect.service';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateProspectDto } from '../dto/update-prospect.dto';
import { ProspectFilterDto } from '../dto/prospect-filter.dto';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { CreateContactHistoryDto } from '../dto/create-contact-history.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('prospects')
@UseGuards(JwtAuthGuard)
export class ProspectController {
  constructor(private readonly prospectService: ProspectService) {}

  @Get()
  async findAll(@Query() filters: ProspectFilterDto) {
    const { prospects, total } = await this.prospectService.findAll(filters);
    return {
      success: true,
      prospects,
      total,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const prospect = await this.prospectService.findOne(id);
    return {
      success: true,
      prospect,
    };
  }

  @Post()
  async create(@Body() createProspectDto: CreateProspectDto, @Req() req) {
    const userId = req.user.id;
    const prospect = await this.prospectService.create(createProspectDto, userId);
    return {
      success: true,
      prospect,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProspectDto: UpdateProspectDto) {
    const prospect = await this.prospectService.update(id, updateProspectDto);
    return {
      success: true,
      prospect,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prospectService.remove(id);
    return {
      success: true,
      message: 'Prospect deleted successfully',
    };
  }

  @Post(':id/documents')
  async addDocument(
    @Param('id') id: string,
    @Body() createDocumentDto: CreateDocumentDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const document = await this.prospectService.addDocument(id, createDocumentDto, userId);
    return {
      success: true,
      document,
    };
  }

  @Post(':id/contact-history')
  async addContactHistory(
    @Param('id') id: string,
    @Body() createContactHistoryDto: CreateContactHistoryDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const result = await this.prospectService.addContactHistory(id, createContactHistoryDto, userId);
    return {
      success: true,
      prospect: result.prospect,
    };
  }
}
