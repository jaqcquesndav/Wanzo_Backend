import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../oidc/entities/user.entity';
import { OIDCClient } from '../oidc/entities/client.entity';
import { OIDCSession } from '../oidc/entities/session.entity';
import { AuthorizationCode } from '../oidc/entities/authorization-code.entity';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OIDCClient, OIDCSession, AuthorizationCode]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}