import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Disbursement } from './entities/disbursement.entity';
import { VirementsService } from './services/virements.service';
import { VirementsController } from './controllers/virements.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Disbursement]),
  ],
  providers: [VirementsService],
  controllers: [VirementsController],
  exports: [VirementsService],
})
export class VirementsModule {}
