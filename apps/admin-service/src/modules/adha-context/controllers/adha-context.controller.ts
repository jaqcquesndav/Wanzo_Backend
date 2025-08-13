import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    Patch,
    Query,
    UseInterceptors,
    UploadedFile,
    HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdhaContextService } from '../services/adha-context.service';
import {
    CreateAdhaContextSourceDto,
    UpdateAdhaContextSourceDto,
    AdhaContextSourceResponseDto,
    AdhaContextPaginatedResponseDto,
    ToggleActiveDto,
    ToggleActiveResponseDto,
    FileUploadResponseDto,
    TagSuggestionsResponseDto,
    ZoneSuggestionsResponseDto,
    AdhaContextQueryDto
} from '../dtos/adha-context.dto';
import { AdhaContextSource, AdhaContextType, ZoneCibleType } from '../entities/adha-context.entity';

@ApiTags('Adha Context')
@Controller('adha-context')
export class AdhaContextController {
    constructor(private readonly adhaContextService: AdhaContextService) {}

    // Méthode utilitaire pour convertir les dates en chaînes de caractères
    private formatContextSource(source: AdhaContextSource): AdhaContextSourceResponseDto {
        return {
            ...source,
            dateDebut: source.dateDebut.toISOString(),
            dateFin: source.dateFin.toISOString(),
            createdAt: source.createdAt.toISOString(),
            updatedAt: source.updatedAt.toISOString()
        };
    }

    // Méthode utilitaire pour convertir les dates de la réponse de toggleActive
    private formatToggleActiveResponse(response: { id: string; active: boolean; updatedAt: Date }): ToggleActiveResponseDto {
        return {
            ...response,
            updatedAt: response.updatedAt.toISOString()
        };
    }

    @Get('sources')
    @ApiOperation({ summary: 'Get all context sources', description: 'Retrieves the list of sources with pagination and filtering' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved sources', type: AdhaContextPaginatedResponseDto })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'type', required: false, enum: AdhaContextType })
    @ApiQuery({ name: 'domaine', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'zoneType', required: false, enum: ZoneCibleType })
    @ApiQuery({ name: 'zoneValue', required: false, type: String })
    @ApiQuery({ name: 'niveau', required: false, type: String })
    @ApiQuery({ name: 'active', required: false, enum: ['true', 'false'] })
    @ApiQuery({ name: 'tags', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'expire', required: false, enum: ['true', 'false'] })
    @ApiQuery({ name: 'dateValidite', required: false, type: Date })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    async findAll(@Query() query: AdhaContextQueryDto): Promise<AdhaContextPaginatedResponseDto> {
        const result = await this.adhaContextService.findAll(query);
        
        // Convertir les dates en chaînes de caractères pour correspondre au DTO de réponse
        const formattedData = result.data.map(source => this.formatContextSource(source));
        
        return {
            data: formattedData,
            pagination: result.pagination
        };
    }

    @Post('sources')
    @ApiOperation({ summary: 'Create a new context source', description: 'Creates a new Adha context source' })
    @ApiResponse({ status: 201, description: 'Successfully created source', type: AdhaContextSourceResponseDto })
    async create(@Body() createDto: CreateAdhaContextSourceDto): Promise<AdhaContextSourceResponseDto> {
        const source = await this.adhaContextService.create(createDto);
        return this.formatContextSource(source);
    }

    @Get('sources/:id')
    @ApiOperation({ summary: 'Get a specific context source', description: 'Retrieves a specific Adha context source by ID' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved source', type: AdhaContextSourceResponseDto })
    @ApiResponse({ status: 404, description: 'Source not found' })
    @ApiParam({ name: 'id', description: 'The ID of the source to retrieve' })
    async findOne(@Param('id') id: string): Promise<AdhaContextSourceResponseDto> {
        const source = await this.adhaContextService.findOne(id);
        return this.formatContextSource(source);
    }

    @Put('sources/:id')
    @ApiOperation({ summary: 'Update a context source', description: 'Updates an existing Adha context source' })
    @ApiResponse({ status: 200, description: 'Successfully updated source', type: AdhaContextSourceResponseDto })
    @ApiResponse({ status: 404, description: 'Source not found' })
    @ApiParam({ name: 'id', description: 'The ID of the source to update' })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateAdhaContextSourceDto,
    ): Promise<AdhaContextSourceResponseDto> {
        const source = await this.adhaContextService.update(id, updateDto);
        return this.formatContextSource(source);
    }

    @Delete('sources/:id')
    @ApiOperation({ summary: 'Delete a context source', description: 'Deletes an Adha context source' })
    @ApiResponse({ status: 204, description: 'Successfully deleted source' })
    @ApiResponse({ status: 404, description: 'Source not found' })
    @ApiParam({ name: 'id', description: 'The ID of the source to delete' })
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        return this.adhaContextService.remove(id);
    }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a file', description: 'Uploads a file for an Adha context source' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Successfully uploaded file', type: FileUploadResponseDto })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<FileUploadResponseDto> {
        return this.adhaContextService.uploadFile(file);
    }

    @Patch('sources/:id/toggle-active')
    @ApiOperation({ summary: 'Toggle active state', description: 'Activates or deactivates a context source' })
    @ApiResponse({ status: 200, description: 'Successfully toggled active state', type: ToggleActiveResponseDto })
    @ApiResponse({ status: 404, description: 'Source not found' })
    @ApiParam({ name: 'id', description: 'The ID of the source to toggle' })
    async toggleActive(
        @Param('id') id: string,
        @Body() toggleDto: ToggleActiveDto,
    ): Promise<ToggleActiveResponseDto> {
        const response = await this.adhaContextService.toggleActive(id, toggleDto);
        return this.formatToggleActiveResponse(response);
    }

    @Get('tag-suggestions')
    @ApiOperation({ summary: 'Get tag suggestions', description: 'Retrieves a list of tag suggestions' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved tags', type: TagSuggestionsResponseDto })
    async getTagSuggestions(): Promise<TagSuggestionsResponseDto> {
        const tags = await this.adhaContextService.getTagSuggestions();
        return { tags };
    }

    @Get('zone-suggestions')
    @ApiOperation({ summary: 'Get zone suggestions', description: 'Retrieves a list of zone suggestions' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved zones', type: ZoneSuggestionsResponseDto })
    async getZoneSuggestions(): Promise<ZoneSuggestionsResponseDto> {
        const zones = await this.adhaContextService.getZoneSuggestions();
        return { zones };
    }
}
