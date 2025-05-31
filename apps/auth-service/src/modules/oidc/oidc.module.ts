import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OIDCClient } from './entities/client.entity';
import { User } from './entities/user.entity';
import { OIDCSession } from './entities/session.entity';
import { AuthorizationCode } from './entities/authorization-code.entity';
import { OIDCService } from './services/oidc.service';
import { UserService } from './services/user.service';
import { SessionService } from './services/session.service';
import { AuthorizationService } from './services/authorization.service';
import { ClientService } from './services/client.service';
import { ScopeService } from './services/scope.service';
import { OIDCController } from './controllers/oidc.controller';
import { UserController } from './controllers/user.controller';
import { AuthorizationController } from './controllers/authorization.controller';
import { SessionController } from './controllers/session.controller';
import { ClientController } from './controllers/client.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([OIDCClient, User, OIDCSession, AuthorizationCode]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key-here'),
        signOptions: { 
          expiresIn: '1h',
          issuer: configService.get('oidc.issuer'),
          audience: 'auth-service',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    OIDCService,
    UserService,
    SessionService,
    AuthorizationService,
    ClientService,
    ScopeService,
    JwtStrategy,
    RolesGuard,
  ],
  controllers: [
    OIDCController,
    UserController,
    AuthorizationController,
    SessionController,
    ClientController,
  ],
  exports: [
    OIDCService,
    UserService,
    SessionService,
    AuthorizationService,
    ClientService,
    ScopeService,
    JwtStrategy,
    RolesGuard,
  ],
})
export class OIDCModule {}