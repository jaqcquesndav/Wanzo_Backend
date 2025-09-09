import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, Req, HttpStatus, HttpCode, UnauthorizedException, NotFoundException, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, ApiResponseDto, ApiErrorResponseDto, VerifyPhoneDto, UploadIdentityDocumentDto, UserPreferencesDto } from '../dto/user.dto';
import { SyncUserDto } from '../dto/sync-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MulterFile } from '../../cloudinary/cloudinary.service';
import { UserType } from '../entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('sync-test')
  @ApiOperation({ summary: 'TEST: Synchroniser utilisateur sans auth (DÉVELOPPEMENT SEULEMENT)' })
  @ApiResponse({ status: 201, description: 'Utilisateur synchronisé avec succès', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides', type: ApiErrorResponseDto })
  async syncUserTest(@Body() syncUserDto: SyncUserDto): Promise<ApiResponseDto<UserResponseDto>> {
    console.log('🧪 [TEST] Sync user test called with data:', JSON.stringify(syncUserDto, null, 2));
    
    if (!syncUserDto.auth0Id) {
      throw new BadRequestException('auth0Id est requis');
    }
    
    try {
      const user = await this.userService.syncUser(syncUserDto);
      console.log('✅ [TEST] User synced successfully:', user?.id);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('❌ [TEST] Sync failed:', error);
      throw error;
    }
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Synchroniser l\'utilisateur depuis Auth0 (gère la première connexion)' })
  @ApiResponse({ status: 201, description: 'Utilisateur synchronisé avec succès', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides', type: ApiErrorResponseDto })
  async syncUser(@Body() syncUserDto: SyncUserDto, @Req() req: any): Promise<ApiResponseDto<UserResponseDto>> {
    // Si l'ID Auth0 n'est pas fourni dans le corps, l'extraire du JWT
    if (!syncUserDto.auth0Id && req.user?.sub) {
      syncUserDto.auth0Id = req.user.sub;
    }
    
    // Si l'email n'est pas fourni dans le corps, l'extraire du JWT
    if (!syncUserDto.email && req.user?.email) {
      syncUserDto.email = req.user.email;
    }
    
    // Si le nom n'est pas fourni dans le corps, l'extraire du JWT
    if (!syncUserDto.name && req.user?.name) {
      syncUserDto.name = req.user.name;
    }
    
    const user = await this.userService.syncUser(syncUserDto);
    return {
      success: true,
      data: user
    };
  }

  @Post('sync/cross-service')
  @ApiOperation({ summary: 'Synchroniser l\'utilisateur depuis un autre service (sans token utilisateur)' })
  @ApiResponse({ status: 201, description: 'Utilisateur synchronisé avec succès', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides', type: ApiErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Accès refusé - Service non autorisé', type: ApiErrorResponseDto })
  async syncUserCrossService(@Body() syncUserDto: SyncUserDto, @Req() req: any): Promise<ApiResponseDto<UserResponseDto>> {
    // Vérifier que l'appel provient d'un service autorisé
    const serviceName = req.headers['x-service-name'];
    const syncSource = req.headers['x-sync-source'];
    
    const allowedServices = ['accounting-service', 'gestion-commerciale-service', 'portfolio-institution-service'];
    
    if (!serviceName || !allowedServices.includes(serviceName)) {
      throw new UnauthorizedException('Service non autorisé pour la synchronisation cross-service');
    }
    
    if (syncSource !== 'cross-service-login') {
      throw new UnauthorizedException('Source de synchronisation non autorisée');
    }
    
    console.log(`🔄 Cross-service sync from ${serviceName} for user ${syncUserDto.auth0Id}`);
    
    // Ajouter des métadonnées pour identifier la source
    if (!syncUserDto.metadata) {
      syncUserDto.metadata = {};
    }
    syncUserDto.metadata.crossServiceSync = true;
    syncUserDto.metadata.originService = serviceName;
    
    const user = await this.userService.syncUser(syncUserDto);
    return {
      success: true,
      data: user
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer le profil utilisateur courant (avec sync automatique)' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur récupéré', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async getCurrentUser(@Req() req: any): Promise<ApiResponseDto<UserResponseDto>> {
    console.log('🎯 [UserController.getCurrentUser] ENTRY POINT - Endpoint /users/me accessed');
    console.log('📋 [UserController.getCurrentUser] Request user data:', JSON.stringify(req.user, null, 2));
    
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      console.log('❌ [UserController.getCurrentUser] No auth0Id found in req.user');
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    console.log('🔍 [UserController.getCurrentUser] Looking for user with Auth0 ID:', auth0Id);
    let user = await this.userService.findByAuth0Id(auth0Id);
    console.log('👤 [UserController.getCurrentUser] User found in database:', user ? 'YES' : 'NO');

    // Si l'utilisateur n'existe pas, le synchroniser automatiquement depuis Auth0
    if (!user) {
      console.log('🔄 [UserController.getCurrentUser] User not found, auto-syncing from Auth0:', auth0Id);
      console.log('📄 [UserController.getCurrentUser] JWT user data:', JSON.stringify(req.user, null, 2));      const syncData = {
        auth0Id,
        email: req.user?.email || `temp-${auth0Id.replace('|', '-')}@wanzo.temp`,
        name: req.user?.name || req.user?.given_name || req.user?.family_name || `User-${auth0Id.split('|')[1]?.substring(0, 8) || 'Unknown'}`,
        firstName: req.user?.given_name,
        lastName: req.user?.family_name,
        picture: req.user?.picture,
        // Par défaut SME, sauf si userType spécifié dans les métadonnées
        userType: req.user?.['https://wanzo.com/user_type'] || 'sme'
      };
      
      console.log('📤 [UserController.getCurrentUser] Sync data prepared:', JSON.stringify(syncData, null, 2));
      
      try {
        console.log('🚀 [UserController.getCurrentUser] Starting user auto-sync...');
        user = await this.userService.syncUser(syncData);
        console.log('✅ [UserController.getCurrentUser] User auto-synced successfully:', user?.id);
        console.log('📊 [UserController.getCurrentUser] Synced user details:', JSON.stringify(user, null, 2));
      } catch (error) {
        console.error('❌ [UserController.getCurrentUser] Auto-sync failed:', error);
        console.error('🔍 [UserController.getCurrentUser] Error details:', error instanceof Error ? error.stack : 'Unknown error');
        throw error;
      }
    }

    console.log('📤 [UserController.getCurrentUser] Returning user data:', user ? 'SUCCESS' : 'NULL');
    return {
      success: true,
      data: user
    };
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer le profil utilisateur avec compagnie/institution associée' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur avec association récupéré', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async getCurrentUserWithAssociation(@Req() req: any): Promise<ApiResponseDto<any>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const profile = await this.userService.findUserWithAssociation(auth0Id);
    return {
      success: true,
      data: profile
    };
  }

  @Post('me/associate-company/:companyId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Associer l\'utilisateur connecté à une compagnie' })
  @ApiResponse({ status: 200, description: 'Association réalisée avec succès', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Compagnie non trouvée', type: ApiErrorResponseDto })
  async associateUserToCompany(@Param('companyId') companyId: string, @Req() req: any): Promise<ApiResponseDto<any>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const result = await this.userService.associateUserToCompany(auth0Id, companyId);
    return {
      success: true,
      data: result,
      meta: { message: 'Utilisateur associé à la compagnie avec succès' }
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur courant' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur mis à jour', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async updateCurrentUser(@Body() updateUserDto: UpdateUserDto, @Req() req: any): Promise<ApiResponseDto<UserResponseDto>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    const updatedUser = await this.userService.update(user.id, updateUserDto);
    return {
      success: true,
      data: updatedUser
    };
  }

  @Patch('me/type')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Changer le type d\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Type d\'utilisateur mis à jour', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async changeUserType(@Body() body: { userType: string }, @Req() req: any): Promise<ApiResponseDto<{ id: string, userType: string, message: string }>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    const updatedUser = await this.userService.changeUserType(user.id, body.userType as UserType);
    return {
      success: true,
      data: {
        id: updatedUser.id,
        userType: updatedUser.userType,
        message: 'Type d\'utilisateur mis à jour avec succès'
      }
    };
  }

  @Post('verify-phone')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Vérifier un numéro de téléphone' })
  @ApiResponse({ status: 200, description: 'Numéro de téléphone vérifié', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Code invalide', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async verifyPhone(@Body() verifyPhoneDto: VerifyPhoneDto, @Req() req: any): Promise<ApiResponseDto<{ phoneVerified: boolean, message: string }>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    // Simuler la vérification du code
    if (verifyPhoneDto.code !== '123456') {
      throw new BadRequestException('Code de vérification invalide');
    }
    
    const updatedUser = await this.userService.update(user.id, { phone: verifyPhoneDto.phone });
    
    return {
      success: true,
      data: {
        phoneVerified: true,
        message: 'Numéro de téléphone vérifié avec succès'
      }
    };
  }

  @Post('me/identity-document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Télécharger une pièce d\'identité' })
  @ApiResponse({ status: 200, description: 'Document d\'identité téléchargé', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async uploadIdentityDocument(
    @Body() uploadIdentityDocumentDto: UploadIdentityDocumentDto,
    @UploadedFile() file: MulterFile,
    @Req() req: any
  ): Promise<ApiResponseDto<{ url: string, documentType: string, message: string }>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    // Call the service method to handle document upload
    const result = await this.userService.uploadIdentityDocument(
      user.id, 
      file, 
      uploadIdentityDocumentDto.idType
    );
    
    return {
      success: true,
      data: {
        url: '', // Mock URL since we don't have actual upload yet
        documentType: result.idType || 'unknown',
        message: 'Document d\'identité téléchargé avec succès et en attente de vérification'
      }
    };
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mettre à jour les préférences utilisateur' })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async updatePreferences(@Body() preferencesDto: UserPreferencesDto, @Req() req: any): Promise<ApiResponseDto<{ message: string, settings: any }>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    const updatedUser = await this.userService.updateUserPreferences(user.id, preferencesDto);
    
    return {
      success: true,
      data: {
        message: 'Préférences mises à jour avec succès',
        settings: updatedUser.settings
      }
    };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer le compte utilisateur' })
  @ApiResponse({ status: 200, description: 'Compte supprimé', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async deleteAccount(@Req() req: any): Promise<ApiResponseDto<{ message: string }>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    await this.userService.remove(user.id);
    
    return {
      success: true,
      data: {
        message: 'Compte supprimé avec succès'
      }
    };
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Télécharger une photo de profil' })
  @ApiResponse({ status: 200, description: 'Photo téléchargée', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async uploadProfilePhoto(
    @UploadedFile() file: MulterFile,
    @Req() req: any
  ): Promise<ApiResponseDto<{ url: string }>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    const result = await this.userService.uploadProfilePhoto(user.id, file);
    
    return {
      success: true,
      data: {
        url: result.picture || ''
      }
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (premier signup)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides', type: ApiErrorResponseDto })
  async createUser(@Body() createUserDto: CreateUserDto, @Req() req: any): Promise<ApiResponseDto<UserResponseDto>> {
    // Extraction des données Auth0 depuis le JWT si pas fourni dans le body
    const auth0Id = req.user?.sub;
    const email = createUserDto.email || req.user?.email;
    const name = createUserDto.name || req.user?.name;

    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Si isFirstTimeUser est true ou pas défini, on utilise la logique de sync
    // qui gère automatiquement la création du premier utilisateur
    if ((createUserDto as any).isFirstTimeUser !== false) {
      const syncUserDto: SyncUserDto = {
        auth0Id,
        email,
        name,
        picture: (createUserDto as any).picture,
      };
      return {
        success: true,
        data: await this.userService.syncUser(syncUserDto)
      };
    }

    // Sinon, utiliser la logique de création standard
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      data: user
    };
  }
}
