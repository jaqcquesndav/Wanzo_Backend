import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth0Strategy } from './strategies/auth0.strategy';
import { Auth0Controller } from './controllers/auth0.controller';
import { Auth0Service } from './services/auth0.service';
import { User } from '../oidc/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { TokenBlacklist } from '@wanzo/shared/security/token-blacklist.entity'; // Reverted to original import path
import { TokenController } from '../auth/controllers/token.controller';
import { TokenBlacklistService } from '../auth/services/token-blacklist.service';
import auth0Config from '../../config/auth0.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'auth0' }),
    ConfigModule.forFeature(auth0Config),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService) => ({
        // Nous n'utilisons pas de secret ici car nous utilisons RS256 avec jwks-rsa
        // pour vérifier les signatures
        verifyOptions: {
          issuer: `https://${configService.get('auth0.domain')}/`,
          audience: configService.get('auth0.audience'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Company, TokenBlacklist]),
  ],
  controllers: [Auth0Controller, TokenController],
  providers: [Auth0Strategy, Auth0Service, TokenBlacklistService],
  exports: [Auth0Service, TokenBlacklistService],
})
export class Auth0Module {}