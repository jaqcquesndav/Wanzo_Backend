import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { SyncUserDto } from '../dto/sync-user.dto';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Synchroniser l\'utilisateur depuis Auth0 (gère la première connexion)' })
  @ApiResponse({ status: 201, description: 'Utilisateur synchronisé avec succès', type: User })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async syncUser(@Body() syncUserDto: SyncUserDto, @Req() req: any): Promise<User> {
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
    
    return this.userService.syncUser(syncUserDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer l\'utilisateur courant' })
  @ApiResponse({ status: 200, description: 'Utilisateur courant récupéré', type: User })
  async getCurrentUser(@Req() req: any): Promise<User> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const user = await this.userService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    return user;
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès', type: User })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée', type: [User] })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('customerId') customerId?: string
  ): Promise<{ users: User[], total: number, page: number, limit: number }> {
    const [users, total] = await this.userService.findAll(+page, +limit, customerId);
    return {
      users,
      total,
      page: +page,
      limit: +limit
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par son ID' })
  @ApiResponse({ status: 200, description: 'Utilisateur récupéré', type: User })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour', type: User })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activer un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur activé', type: User })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async activate(@Param('id') id: string): Promise<User> {
    return this.userService.activate(id);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur désactivé', type: User })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async deactivate(@Param('id') id: string): Promise<User> {
    return this.userService.deactivate(id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Récupérer les activités d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Activités récupérées' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getUserActivities(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ activities: any[], total: number, page: number, limit: number }> {
    const [activities, total] = await this.userService.getUserActivities(id, +page, +limit);
    return {
      activities,
      total,
      page: +page,
      limit: +limit
    };
  }
}
