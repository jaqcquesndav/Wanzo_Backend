import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './services/auth.service';
import { AuthMiddleware } from './middleware/auth.middleware';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBlacklist } from './entities';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenBlacklist]),
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
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}