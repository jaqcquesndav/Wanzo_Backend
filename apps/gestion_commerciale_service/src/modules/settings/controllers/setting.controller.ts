import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SettingService } from '../services/setting.service';
import { CreateSettingDto, UpdateSettingDto } from '../dtos/setting.dto';
import { Setting, SettingCategory } from '../entities/setting.entity';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@/modules/auth/entities/user.entity';

@ApiTags('Paramètres')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingController {
  private readonly logger = new Logger(SettingController.name);
  
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les paramètres' })
  @ApiResponse({ status: 200, description: 'Paramètres récupérés avec succès', type: [Setting] })
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  async findAll(@Req() req: any) {
    this.logger.log('Récupération de tous les paramètres');
    const settings = await this.settingService.findAll(req.user.companyId);
    return {
      success: true,
      data: settings,
    };
  }

  @Get('public')
  @ApiOperation({ summary: 'Récupérer les paramètres publics' })
  @ApiResponse({ status: 200, description: 'Paramètres publics récupérés avec succès', type: [Setting] })
  async findPublic(@Req() req: any) {
    this.logger.log('Récupération des paramètres publics');
    const settings = await this.settingService.findPublic(req.user.companyId);
    return {
      success: true,
      data: settings,
    };
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Récupérer les paramètres par catégorie' })
  @ApiParam({ name: 'category', enum: SettingCategory, description: 'Catégorie de paramètres' })
  @ApiResponse({ status: 200, description: 'Paramètres récupérés avec succès', type: [Setting] })
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  async findByCategory(
    @Param('category') category: SettingCategory,
    @Req() req: any
  ) {
    this.logger.log(`Récupération des paramètres de catégorie: ${category}`);
    const settings = await this.settingService.findByCategory(req.user.companyId, category);
    return {
      success: true,
      data: settings,
    };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Récupérer un paramètre par sa clé' })
  @ApiParam({ name: 'key', description: 'Clé du paramètre' })
  @ApiResponse({ status: 200, description: 'Paramètre récupéré avec succès', type: Setting })
  @ApiResponse({ status: 404, description: 'Paramètre non trouvé' })
  async findOne(@Param('key') key: string, @Req() req: any) {
    this.logger.log(`Récupération du paramètre avec la clé: ${key}`);
    const setting = await this.settingService.findByKey(req.user.companyId, key);
    return {
      success: true,
      data: setting,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau paramètre' })
  @ApiResponse({ status: 201, description: 'Paramètre créé avec succès', type: Setting })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async create(@Body() createSettingDto: CreateSettingDto, @Req() req: any) {
    this.logger.log(`Création d'un nouveau paramètre: ${createSettingDto.key}`);
    const setting = await this.settingService.create(
      req.user.companyId,
      createSettingDto,
      req.user.id
    );
    return {
      success: true,
      data: setting,
      message: 'Paramètre créé avec succès'
    };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Mettre à jour un paramètre' })
  @ApiParam({ name: 'key', description: 'Clé du paramètre' })
  @ApiResponse({ status: 200, description: 'Paramètre mis à jour avec succès', type: Setting })
  @ApiResponse({ status: 404, description: 'Paramètre non trouvé' })
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Req() req: any
  ) {
    this.logger.log(`Mise à jour du paramètre avec la clé: ${key}`);
    const setting = await this.settingService.update(
      req.user.companyId,
      key,
      updateSettingDto
    );
    return {
      success: true,
      data: setting,
      message: 'Paramètre mis à jour avec succès'
    };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Supprimer un paramètre' })
  @ApiParam({ name: 'key', description: 'Clé du paramètre' })
  @ApiResponse({ status: 200, description: 'Paramètre supprimé avec succès' })
  @ApiResponse({ status: 400, description: 'Les paramètres système ne peuvent pas être supprimés' })
  @ApiResponse({ status: 404, description: 'Paramètre non trouvé' })
  @Roles(UserRole.OWNER)
  async remove(@Param('key') key: string, @Req() req: any) {
    this.logger.log(`Suppression du paramètre avec la clé: ${key}`);
    await this.settingService.remove(req.user.companyId, key);
    return {
      success: true,
      message: 'Paramètre supprimé avec succès'
    };
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialiser les paramètres par défaut' })
  @ApiResponse({ status: 201, description: 'Paramètres initialisés avec succès' })
  @Roles(UserRole.OWNER)
  async initializeDefaults(@Req() req: any) {
    this.logger.log('Initialisation des paramètres par défaut');
    await this.settingService.initializeDefaultSettings(req.user.companyId, req.user.id);
    return {
      success: true,
      message: 'Paramètres par défaut initialisés avec succès'
    };
  }
}
