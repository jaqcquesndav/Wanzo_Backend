import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { UserActivity, ActivityType } from './entities/user-activity.entity';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
import { ListUserActivitiesDto } from './dto/list-user-activities.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
  ) {}

  /**
   * Crée une nouvelle activité utilisateur
   */
  async createUserActivity(createUserActivityDto: CreateUserActivityDto): Promise<UserActivity> {
    this.logger.log(`Création d'une nouvelle activité pour l'utilisateur ${createUserActivityDto.userId}`);
    
    const activity = this.userActivityRepository.create({
      ...createUserActivityDto,
    });
    
    return this.userActivityRepository.save(activity);
  }

  /**
   * Trouve une activité utilisateur par ID
   */
  async findUserActivityById(id: string): Promise<UserActivity> {
    this.logger.log(`Recherche de l'activité utilisateur avec l'ID: ${id}`);
    
    const activity = await this.userActivityRepository.findOne({
      where: { id }
    });
    
    if (!activity) {
      throw new NotFoundException(`Activité utilisateur avec l'ID ${id} non trouvée`);
    }
    
    return activity;
  }

  /**
   * Liste les activités utilisateur avec filtrage et pagination
   */
  async listUserActivities(queryParams: ListUserActivitiesDto) {
    const { userId, activityType, module, startDate, endDate } = queryParams;
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;
    
    this.logger.log(`Récupération des activités utilisateur - page: ${page}, limit: ${limit}`);
    
    // Construire les conditions where
    const whereConditions: FindOptionsWhere<UserActivity> = {};
    
    if (userId) {
      whereConditions.userId = userId;
    }
    
    if (activityType) {
      whereConditions.activityType = activityType;
    }
    
    if (module) {
      whereConditions.module = module;
    }
    
    // Ajouter la condition de date si nécessaire
    if (startDate && endDate) {
      whereConditions.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    
    // Exécuter la requête
    const [activities, total] = await this.userActivityRepository.findAndCount({
      where: whereConditions,
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });
    
    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupère les activités d'un utilisateur spécifique
   */
  async getUserActivities(userId: string, queryParams: ListUserActivitiesDto) {
    this.logger.log(`Récupération des activités pour l'utilisateur avec l'ID: ${userId}`);
    
    // On utilise directement la fonction listUserActivities en forçant l'ID utilisateur
    const params = { ...queryParams, userId };
    return this.listUserActivities(params);
  }

  /**
   * Enregistre une activité utilisateur de manière optimisée
   * Cette méthode peut être appelée depuis d'autres services
   */
  async logUserActivity(
    userId: string, 
    activityType: ActivityType, 
    description?: string,
    additionalData?: Partial<UserActivity>
  ): Promise<void> {
    try {
      this.logger.debug(`Enregistrement d'activité pour l'utilisateur ${userId}: ${activityType}`);
      
      const activity = this.userActivityRepository.create({
        userId,
        activityType,
        description,
        ...additionalData,
      });
      
      await this.userActivityRepository.save(activity);
    } catch (error) {
      // On ne veut pas que l'enregistrement d'activité bloque le flux principal
      const err = error as Error;
      this.logger.error(`Erreur lors de l'enregistrement d'activité utilisateur: ${err.message}`, err.stack);
    }
  }
}
