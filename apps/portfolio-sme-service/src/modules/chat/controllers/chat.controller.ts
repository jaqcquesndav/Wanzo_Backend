import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CreateChatDto, CreateMessageDto, ChatFilterDto } from '../dtos/chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('portfolio-sme-chat')
@Controller('portfolio-sme-chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Roles('admin', 'sme-user')
  @ApiOperation({ summary: 'Créer une nouvelle session de chat pour portfolio SME' })
  @ApiResponse({ status: 201, description: 'Session de chat créée avec succès' })
  @ApiResponse({ status: 400, description: 'Entrée invalide' })
  async create(@Body() createChatDto: CreateChatDto, @Req() req: any) {
    // Supposons que req.user contient id et companyId
    const chat = await this.chatService.create(createChatDto, req.user.id, req.user.companyId);
    return { success: true, chat };
  }

  @Get()
  @Roles('admin', 'sme-user')
  @ApiOperation({ summary: 'Récupérer toutes les sessions de chat portfolio SME' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'company_id', required: false })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Sessions de chat récupérées avec succès' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 20,
    @Query() filters: ChatFilterDto,
    @Req() req: any,
  ) {
    if (req.user.role !== 'admin') {
      filters.companyId = req.user.companyId;
    }
    const result = await this.chatService.findAll(filters, +page, +perPage);
    return { success: true, ...result };
  }

  @Get(':id')
  @Roles('admin', 'sme-user')
  @ApiOperation({ summary: 'Récupérer une session de chat par ID' })
  @ApiParam({ name: 'id', description: 'ID du chat' })
  @ApiResponse({ status: 200, description: 'Session de chat récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Session de chat non trouvée' })
  async findOne(@Param('id') id: string) {
    const chat = await this.chatService.findById(id);
    return { success: true, chat };
  }

  @Post(':id/message')
  @Roles('admin', 'sme-user')
  @ApiOperation({ summary: 'Ajouter un message au chat portfolio SME' })
  @ApiParam({ name: 'id', description: 'ID du chat' })
  @ApiResponse({ status: 201, description: 'Message ajouté avec succès' })
  @ApiResponse({ status: 404, description: 'Session de chat non trouvée' })
  async addMessage(
    @Param('id') id: string,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
  ) {
    const message = await this.chatService.addMessage(id, createMessageDto, req.user.id);
    return { success: true, message };
  }

  @Get(':id/history')
  @Roles('admin', 'sme-user')
  @ApiOperation({ summary: 'Récupérer l’historique des messages du chat' })
  @ApiParam({ name: 'id', description: 'ID du chat' })
  @ApiResponse({ status: 200, description: 'Historique récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Session de chat non trouvée' })
  async getHistory(@Param('id') id: string) {
    const messages = await this.chatService.getHistory(id);
    return { success: true, messages };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer (désactiver) une session de chat' })
  @ApiParam({ name: 'id', description: 'ID du chat' })
  @ApiResponse({ status: 200, description: 'Session de chat supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Session de chat non trouvée' })
  async remove(@Param('id') id: string) {
    return await this.chatService.delete(id);
  }

  @Get(':id/usage')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtenir les statistiques d’usage des tokens du chat' })
  @ApiParam({ name: 'id', description: 'ID du chat' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  @ApiResponse({ status: 404, description: 'Session de chat non trouvée' })
  async getTokenUsage(@Param('id') id: string) {
    const usage = await this.chatService.getTokenUsage(id);
    return { success: true, usage };
  }

  @Get('context/:companyId')
  @Roles('admin', 'sme-user')
  @ApiOperation({ summary: 'Obtenir le contexte agrégé (portefeuille et rapport)' })
  @ApiParam({ name: 'companyId', description: 'ID de l’entreprise' })
  @ApiResponse({ status: 200, description: 'Contexte agrégé récupéré avec succès' })
  async getAggregatedContext(@Param('companyId') companyId: string) {
    const context = await this.chatService.getAggregatedContext(companyId);
    return { success: true, context };
  }
}
