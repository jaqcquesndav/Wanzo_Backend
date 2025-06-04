import { Module } from '@nestjs/common';
import { AuthService } from '@/modules/auth/services/auth.service';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { LocalStrategy } from '@/modules/auth/strategies/local.strategy';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController, KsAuthController, UsersController } from '@/modules/auth/auth.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '60m') },
      }),
      inject: [ConfigService],
    }),
  ],  controllers: [AuthController, UsersController, KsAuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, JwtBlacklistGuard],
  exports: [AuthService, JwtBlacklistGuard, JwtModule],
})
export class AuthModule {}