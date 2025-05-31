import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Company } from '../company/entities/company.entity'; // Import Company entity
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { CompanyModule } from '../company/company.module'; // Import CompanyModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company]), // Include Company here
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '3600s') }, // Default to 1 hour
      }),
      inject: [ConfigService],
    }),
    ConfigModule, // Ensure ConfigModule is available
    CompanyModule, // Import CompanyModule to use CompanyService if needed by AuthService or for DI
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule, JwtStrategy, LocalStrategy], // Export strategies and guards if needed elsewhere
})
export class AuthModule {}
