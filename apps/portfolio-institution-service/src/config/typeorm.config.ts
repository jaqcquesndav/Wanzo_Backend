import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Import all entities explicitly
import { AuthUser } from '../modules/auth/entities/user.entity';
import { TokenBlacklist } from '../modules/auth/entities/token-blacklist.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserSession } from '../modules/users/entities/user-session.entity';
import { UserPreference } from '../modules/users/entities/user-preference.entity';
import { UserActivity } from '../modules/users/entities/user-activity.entity';
import { Institution } from '../modules/institution/entities/institution.entity';
import { InstitutionUser } from '../modules/institution/entities/institution-user.entity';

export const createTypeOrmOptions = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'password'),
  database: configService.get('DB_DATABASE', 'portfolio-institution-service'),
  entities: [
    AuthUser,
    TokenBlacklist,
    User,
    UserSession,
    UserPreference,
    UserActivity,
    Institution,
    InstitutionUser,
    // Add other entities here as needed
  ],
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
  dropSchema: false,
  retryAttempts: 3,
  retryDelay: 3000,
});