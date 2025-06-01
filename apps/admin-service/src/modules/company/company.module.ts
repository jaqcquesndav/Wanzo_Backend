import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './controllers';
import { CompanyService } from './services';
import { Company } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company])
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService]
})
export class CompanyModule {}
