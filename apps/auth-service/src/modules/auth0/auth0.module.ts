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
    TypeOrmModule.forFeature([User, Company]),
  ],
  controllers: [Auth0Controller],
  providers: [Auth0Strategy, Auth0Service],
  exports: [Auth0Service],
})
export class Auth0Module {}