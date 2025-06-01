import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { SystemController } from './controllers';
import { SystemService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(entities).filter(entity => typeof entity === 'function'))
  ],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService]
})
export class SystemModule {}
