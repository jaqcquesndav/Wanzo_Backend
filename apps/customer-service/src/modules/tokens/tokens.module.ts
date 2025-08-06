import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from './services/token.service';
import { TokenController } from './controllers/token.controller';
import { TokenUsage } from './entities/token-usage.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { TokenPurchase } from './entities/token-purchase.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../system-users/entities/user.entity';
import { CustomersModule } from '../customers/customers.module';
import { SystemUsersModule } from '../system-users/system-users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenUsage, TokenPurchase, Customer, User]),
    forwardRef(() => KafkaModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => SystemUsersModule),
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokensModule {}
