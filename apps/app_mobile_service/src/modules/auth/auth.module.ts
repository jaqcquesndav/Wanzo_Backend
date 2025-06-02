import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtBlacklistGuard } from './guards/jwt-blacklist.guard'; // Added
import { HttpModule } from '@nestjs/axios'; // Added
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company]),
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
    forwardRef(() => CompanyModule), // Use forwardRef here for CompanyModule
    HttpModule.register({ // Added HttpModule configuration
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, JwtBlacklistGuard], // Added JwtBlacklistGuard
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule, JwtStrategy, LocalStrategy, JwtBlacklistGuard], // Added JwtBlacklistGuard
})
export class AuthModule {}
