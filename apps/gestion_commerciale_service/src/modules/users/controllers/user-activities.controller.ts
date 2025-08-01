import { Controller, Get, Post, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '@/modules/users/users.service';
import { CreateUserActivityDto } from '@/modules/users/dto/create-user-activity.dto';
import { ListUserActivitiesDto } from '@/modules/users/dto/list-user-activities.dto';
import { UserActivity } from '@/modules/users/entities/user-activity.entity';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@/modules/auth/entities/user.entity';

@ApiTags('Activités utilisateurs')
@Controller('user-activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserActivitiesController {
  private readonly logger = new Logger(UserActivitiesController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle activité utilisateur' })
  @ApiResponse({ 
    status: 201, 
    description: 'Activité créée avec succès',
    type: UserActivity
  })
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async createActivity(@Body() createUserActivityDto: CreateUserActivityDto): Promise<UserActivity> {
    this.logger.log(`Création d'une nouvelle activité pour l'utilisateur ${createUserActivityDto.userId}`);
    return this.usersService.createUserActivity(createUserActivityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des activités utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des activités récupérée avec succès',
    type: [UserActivity]
  })
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAll(@Query() queryParams: ListUserActivitiesDto) {
    this.logger.log('Récupération de la liste des activités utilisateur');
    return this.usersService.listUserActivities(queryParams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une activité utilisateur par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'activité à récupérer' })
  @ApiResponse({
    status: 200,
    description: 'Activité récupérée avec succès',
    type: UserActivity
  })
  @ApiResponse({ status: 404, description: 'Activité non trouvée' })
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findOne(@Param('id') id: string): Promise<UserActivity> {
    this.logger.log(`Récupération de l'activité avec l'ID: ${id}`);
    return this.usersService.findUserActivityById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer les activités d\'un utilisateur spécifique' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Activités récupérées avec succès',
    type: [UserActivity]
  })
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findByUserId(
    @Param('userId') userId: string,
    @Query() queryParams: ListUserActivitiesDto
  ) {
    this.logger.log(`Récupération des activités pour l'utilisateur avec l'ID: ${userId}`);
    return this.usersService.getUserActivities(userId, queryParams);
  }
}
