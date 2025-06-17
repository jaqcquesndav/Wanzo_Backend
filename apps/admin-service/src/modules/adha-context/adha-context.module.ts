import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdhaContextSource } from './entities/adha-context.entity';
import { AdhaContextService } from './services/adha-context.service';
import { AdhaContextController } from './controllers/adha-context.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdhaContextSource]),
    MulterModule.register({
      dest: './uploads/adha-context',
    }),
  ],
  controllers: [AdhaContextController],
  providers: [AdhaContextService],
  exports: [AdhaContextService],
})
export class AdhaContextModule {}
