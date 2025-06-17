import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CompanyController } from './controllers';
import { CompanyService } from './services';
import { Company } from './entities';
import { Location } from './entities/location.entity';
import { AuthModule } from '../auth/auth.module';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Location]),
    AuthModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const randomName = uuid();
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, callback) => {
        // Accept only specific file types
        if (file.fieldname === 'logo') {
          if (!file.originalname.match(/\.(jpg|jpeg|png|svg)$/i)) {
            return callback(new Error('Logo must be JPG, PNG, or SVG format'), false);
          }
        } else if (file.fieldname === 'file') { // for documents
          if (!file.originalname.match(/\.(pdf)$/i)) {
            return callback(new Error('Document must be PDF format'), false);
          }
        }
        callback(null, true);
      },
    }),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService]
})
export class CompanyModule {}
