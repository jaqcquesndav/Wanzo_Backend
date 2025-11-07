import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { HealthController } from './health.controller';
import { UsersModule } from './modules/users/users.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { IpfsModule } from './modules/ipfs/ipfs.module';
import { AuthModule } from './auth/auth.module';
import { CreditsController } from './modules/credits/credits.controller';
import { DisbursementsController } from './modules/disbursements/disbursements.controller';
import { RepaymentsController } from './modules/repayments/repayments.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BlockchainModule,
    UsersModule,
    ContractsModule,
    PdfModule,
    IpfsModule,
    AuthModule,
  ],
  controllers: [HealthController, CreditsController, DisbursementsController, RepaymentsController],
})
export class AppModule {}
