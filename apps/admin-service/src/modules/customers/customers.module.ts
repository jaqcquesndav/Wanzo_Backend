import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CustomersController } from './controllers';
import { CustomersService } from './services';
import { 
  Customer, 
  CustomerDocument, 
  CustomerActivity, 
  ValidationProcess, 
  ValidationStep,
  PmeSpecificData,
  FinancialInstitutionSpecificData
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
      PmeSpecificData,
      FinancialInstitutionSpecificData
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
    EventsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService]
})
export class CustomersModule {}
