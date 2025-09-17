import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { CustomerSyncService } from './services/customer-sync.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtBlacklistGuard } from './guards/jwt-blacklist.guard';
import { HttpModule } from '@nestjs/axios';
import { SharedModule } from '../shared/shared.module';
import { EventsModule } from '../events/events.module';
import { CompanyModule } from '../company/company.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, TokenBlacklist } from './entities';
import { Company } from '../company/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TokenBlacklist, Company]),
    SharedModule,
    CompanyModule, // Ajouter le CompanyModule pour CompanyService
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '3600s') },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    forwardRef(() => EventsModule),
  ],  
  providers: [AuthService, JwtStrategy, LocalStrategy, CustomerSyncService, JwtAuthGuard, JwtBlacklistGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule, JwtStrategy, LocalStrategy, CustomerSyncService, JwtAuthGuard, JwtBlacklistGuard],
})
export class AuthModule {}
