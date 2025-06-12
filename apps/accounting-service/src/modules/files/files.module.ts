import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileService } from './services/file.service';

@Module({
  imports: [ConfigModule],
  providers: [FileService],
  exports: [FileService],
})
export class FilesModule {}
