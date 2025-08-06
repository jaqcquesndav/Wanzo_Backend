import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface StoredFile {
  originalName: string;
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
  hash: string;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly baseStoragePath: string;

  constructor(private readonly configService: ConfigService) {
    this.baseStoragePath = this.configService.get<string>('FILE_STORAGE_PATH') || path.join(process.cwd(), 'storage');
    this.ensureStorageDirectoryExists();
  }

  private ensureStorageDirectoryExists() {
    if (!fs.existsSync(this.baseStoragePath)) {
      this.logger.log(`Creating storage directory at ${this.baseStoragePath}`);
      fs.mkdirSync(this.baseStoragePath, { recursive: true });
    }
  }

  private ensureDirectoryExists(directoryPath: string) {
    const fullPath = path.join(this.baseStoragePath, directoryPath);
    if (!fs.existsSync(fullPath)) {
      this.logger.log(`Creating directory at ${fullPath}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
  }

  async saveFile(file: Express.Multer.File, subDirectory = ''): Promise<StoredFile> {
    const storagePath = this.ensureDirectoryExists(subDirectory);
    
    // Generate a secure file name to avoid path traversal attacks
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(subDirectory, uniqueFileName);
    const fullPath = path.join(storagePath, uniqueFileName);
    
    // Calculate hash of file content for integrity verification
    const hash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');
    
    return new Promise((resolve, reject) => {
      fs.writeFile(fullPath, file.buffer, (err) => {
        if (err) {
          this.logger.error(`Error saving file ${file.originalname}: ${err.message}`, err.stack);
          reject(err);
          return;
        }
        
        const storedFile: StoredFile = {
          originalName: file.originalname,
          fileName: uniqueFileName,
          path: filePath,
          mimeType: file.mimetype,
          size: file.size,
          hash
        };
        
        this.logger.log(`File saved successfully: ${file.originalname} -> ${fullPath}`);
        resolve(storedFile);
      });
    });
  }

  async getFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseStoragePath, filePath);
    
    return new Promise((resolve, reject) => {
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          this.logger.error(`Error reading file ${filePath}: ${err.message}`, err.stack);
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }

  async readFileAsBase64(filePath: string): Promise<string> {
    try {
      const fileBuffer = await this.getFile(filePath);
      return fileBuffer.toString('base64');
    } catch (error: any) {
      this.logger.error(`Error converting file to base64: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseStoragePath, filePath);
    
    return new Promise((resolve, reject) => {
      fs.unlink(fullPath, (err) => {
        if (err) {
          this.logger.error(`Error deleting file ${filePath}: ${err.message}`, err.stack);
          reject(err);
          return;
        }
        this.logger.log(`File deleted successfully: ${filePath}`);
        resolve();
      });
    });
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseStoragePath, filePath);
    return new Promise((resolve) => {
      fs.access(fullPath, fs.constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  }
}
