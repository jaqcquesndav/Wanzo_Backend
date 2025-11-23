import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import * as entities from './entities';
import { FinanceController } from './controllers';
import { FinanceService } from './services';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([...Object.values(entities).filter(entity => typeof entity === 'function'), User]),
    AuthModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    forwardRef(() => EventsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService]
})
export class FinanceModule {}
