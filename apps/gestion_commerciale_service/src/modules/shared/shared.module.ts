import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { EntitiesModule } from './entities.module';

/**
 * SharedModule extends EntitiesModule to provide centralized entity repositories
 * and prevent circular dependencies between modules.
 */
@Module({
  imports: [
    EntitiesModule,
    TypeOrmModule.forFeature([
      User,
      Company
    ]),
  ],
  exports: [EntitiesModule, TypeOrmModule],
})
export class SharedModule {}
