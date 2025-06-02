import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { Supplier } from './entities/supplier.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule if CurrentUser decorator or JwtAuthGuard is used
import { Company } from '../company/entities/company.entity'; // Import Company entity

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, Company]),
    AuthModule, // Add AuthModule to imports if guards/decorators from it are used
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
