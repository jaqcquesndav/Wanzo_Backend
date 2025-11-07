import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { CustomerSyncService } from './services/customer-sync.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport, KafkaOptions } from '@nestjs/microservices';
import { User } from './entities';
import { getKafkaConfig } from '@wanzobe/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService): KafkaOptions => {
          const kafkaOptions = getKafkaConfig(configService);
          if (!kafkaOptions.options) {
            throw new Error('Kafka options not properly configured');
          }
          
          const brokers = kafkaOptions.options.client?.brokers || ['localhost:9092'];
          
          return {
            transport: Transport.KAFKA,
            options: {
              ...kafkaOptions.options,
              client: {
                ...kafkaOptions.options.client,
                brokers,
                clientId: configService.get<string>('KAFKA_CLIENT_ID', 'admin-service-auth-producer'),
              },
              producer: {
                allowAutoTopicCreation: true,
              },
              consumer: {
                ...(kafkaOptions.options?.consumer || {}),
                groupId: configService.get<string>('KAFKA_GROUP_ID', 'admin-service-auth-group'),
                allowAutoTopicCreation: true,
              },
            }
          };
        },
        inject: [ConfigService],
      }
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomerSyncService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, CustomerSyncService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
