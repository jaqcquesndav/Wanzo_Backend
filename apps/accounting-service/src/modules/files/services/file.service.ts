import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StoredFile {
  path: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly baseStoragePath: string;

  constructor(private readonly configService: ConfigService) {
    this.baseStoragePath = this.configService.get<string>('FILE_STORAGE_PATH', './uploads');
  }

  async saveFile(
    file: Express.Multer.File,
    subDirectory: string,
  ): Promise<StoredFile> {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const directoryPath = path.join(this.baseStoragePath, subDirectory);
    const filePath = path.join(directoryPath, fileName);

    try {
      await fs.mkdir(directoryPath, { recursive: true });
      await fs.writeFile(filePath, file.buffer);

      this.logger.log(`File saved: ${filePath}`);
      return {
        path: filePath,
        fileName: file.originalname, // Store original filename for reference
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error: any) { // Typed error as any
      this.logger.error(`Error saving file ${file.originalname} to ${filePath}:`, error);
      throw new InternalServerErrorException('Failed to save file.');
    }
  }

  async readFileAsBase64(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath); // Ensure the path is absolute
      const data = await fs.readFile(absolutePath);
      return data.toString('base64');
    } catch (error: any) { // Typed error as any
      this.logger.error(`Error reading file ${filePath}:`, error);
      if (error.code === 'ENOENT') {
        throw new InternalServerErrorException(`File not found at path: ${filePath}`);
      }
      throw new InternalServerErrorException('Failed to read file.');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath); // Ensure the path is absolute
      await fs.unlink(absolutePath);
      this.logger.log(`File deleted: ${absolutePath}`);
    } catch (error: any) { // Typed error as any
      this.logger.error(`Error deleting file ${filePath}:`, error);
      // It's common to not throw if the file doesn't exist during a delete operation,
      // or to handle it specifically if needed. For now, we'll log and continue.
      if (error.code !== 'ENOENT') {
        throw new InternalServerErrorException('Failed to delete file.');
      }
    }
  }
}
