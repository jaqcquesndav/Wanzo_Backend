import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './services/auth.service';
import { JwtBlacklistGuard } from './guards/jwt-blacklist.guard';
import { CustomerSyncService } from './services/customer-sync.service';
import { AuthUser, TokenBlacklist } from './entities';
import { InstitutionModule } from '../institution/institution.module';
import { KafkaClientModule } from '../events/kafka-client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthUser,       // Auth User entity (table: auth_users)
      TokenBlacklist, // TokenBlacklist entity
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
    InstitutionModule, // Ajout pour InstitutionService
    KafkaClientModule, // Ajout pour KAFKA_PRODUCER_SERVICE
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy, AuthService, CustomerSyncService, JwtBlacklistGuard],
  exports: [AuthService, CustomerSyncService, JwtBlacklistGuard],
})
export class AuthModule {}
