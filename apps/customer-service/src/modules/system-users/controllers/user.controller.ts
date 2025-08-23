import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, Req, HttpStatus, HttpCode, UnauthorizedException, NotFoundException, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, ApiResponseDto, ApiErrorResponseDto, VerifyPhoneDto, UploadIdentityDocumentDto, UserPreferencesDto } from '../dto/user.dto';
import { SyncUserDto } from '../dto/sync-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MulterFile } from '../../cloudinary/cloudinary.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer le profil utilisateur courant' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur récupéré', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async getCurrentUser(@Req() req: any): Promise<ApiResponseDto<UserResponseDto>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    return {
      success: true,
      data: user
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
    
    const updatedUser = await this.userService.changeUserType(user.id, body.userType);
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
        url: result.url,
        documentType: result.idType,
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
        url: result.url
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
