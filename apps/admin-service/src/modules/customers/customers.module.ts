import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './controllers';
import { CustomersService } from './services';
import { Customer, CustomerDocument } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerDocument])
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService]
})
export class CustomersModule {}
