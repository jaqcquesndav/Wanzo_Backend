import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminCustomerProfilesController } from './controllers/admin-customer-profiles.controller';
import { ValidationController } from './controllers/validation.controller';
import { DocumentsController } from './controllers/documents.controller';
import { CustomerDataConsumer } from './consumers/customer-data.consumer';
import { CustomersService } from './services';
import { ValidationService } from './services/validation.service';
import { CustomerProfileWorkflowService } from './services/customer-profile-workflow.service';
import { CustomersSyncService } from './services/customers-sync.service';
import { 
  Customer, 
  CustomerDocument, 
  CustomerActivity, 
  ValidationProcess, 
  ValidationStep,
  CustomerDetailedProfile
} from './entities';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer, 
      CustomerDocument, 
      CustomerActivity, 
      ValidationProcess, 
      ValidationStep,
      CustomerDetailedProfile
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/customer-documents',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
    AuthModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    forwardRef(() => EventsModule),
  ],
  controllers: [
    AdminCustomerProfilesController, 
    ValidationController, 
    DocumentsController,
    CustomerDataConsumer  // Consumer Kafka pour sync inter-services
  ],
  providers: [
    CustomersService, 
    ValidationService,
    CustomerProfileWorkflowService,
    CustomersSyncService
  ],
  exports: [
    CustomersService, 
    ValidationService,
    CustomerProfileWorkflowService,
    CustomersSyncService
  ]
})
export class CustomersModule {}
