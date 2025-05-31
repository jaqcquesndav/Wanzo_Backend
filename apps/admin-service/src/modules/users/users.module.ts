import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { ActivitiesModule } from '../activities/activities.module';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    HttpModule,
    ConfigModule,
    ActivitiesModule,
  ],
  providers: [
    UserService,
    {
      provide: 'MAILER',
      useFactory: (configService: ConfigService) => {
        return nodemailer.createTransport(smtpTransport({
          host: configService.get('mail.host'),
          port: configService.get('mail.port'),
          secure: configService.get('mail.secure'),
          auth: {
            user: configService.get('mail.auth.user'),
            pass: configService.get('mail.auth.pass'),
          },
        }));
      },
      inject: [ConfigService],
    },
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UsersModule {}