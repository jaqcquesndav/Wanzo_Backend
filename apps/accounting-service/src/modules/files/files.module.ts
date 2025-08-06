import { Module } from '@nestjs/common';
import { FileService } from './services/file.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [FileService],
  exports: [FileService],
})
export class FilesModule {}
