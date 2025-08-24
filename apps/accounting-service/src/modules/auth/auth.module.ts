import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { CustomerSyncService } from './services/customer-sync.service';
import { AuthMiddleware } from './middleware/auth.middleware';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, TokenBlacklist } from './entities';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { UserController } from './controllers/user.controller';
import { OrganizationModule } from '../organization/organization.module';
import { KafkaModule } from '../kafka/kafka.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TokenBlacklist]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
    OrganizationModule, // Ajout du module Organization
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get<string>('KAFKA_CLIENT_ID', 'accounting-auth-producer'),
              brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            producer: {
              allowAutoTopicCreation: configService.get<boolean>('KAFKA_ALLOW_AUTO_TOPIC_CREATION', true),
            }
          },
        }),
        inject: [ConfigService],
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '60m') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [JwtStrategy, AuthService, UserService, CustomerSyncService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, UserService, CustomerSyncService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
