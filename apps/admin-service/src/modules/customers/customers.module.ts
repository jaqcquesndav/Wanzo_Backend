import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './controllers';
import { CustomersService } from './services';
import { Customer, CustomerDocument } from './entities';
import { AuthModule } from '../auth/auth.module'; // Importer AuthModule
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerDocument]),
    AuthModule, // Ajouter AuthModule pour accéder à JwtBlacklistGuard
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService]
})
export class CustomersModule {}
