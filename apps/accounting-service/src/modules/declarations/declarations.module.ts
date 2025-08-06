import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DeclarationController } from './declaration.controller';
import { DeclarationService } from './services/declaration.service';
import { Declaration } from './entities/declaration.entity';
import { DeclarationAttachment } from './entities/declaration-attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Declaration, DeclarationAttachment]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/declarations',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limite
      },
    }),
  ],
  controllers: [DeclarationController],
  providers: [DeclarationService],
  exports: [DeclarationService],
})
export class DeclarationModule {}
