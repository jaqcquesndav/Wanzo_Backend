import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule if CurrentUser decorator or JwtAuthGuard is used

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    AuthModule, // Needed for @CurrentUser and @JwtAuthGuard in CompanyController
  ],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService], // Export CompanyService if it needs to be used by other modules (e.g., AuthService)
})
export class CompanyModule {}
