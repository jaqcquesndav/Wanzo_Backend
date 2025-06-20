import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileCategory, FileEntityType } from '../entities/file.entity';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { UpdateFileDto } from '../dtos/update-file.dto';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async uploadFile(file: Express.Multer.File, uploadFileDto: UploadFileDto, companyId: string, userId: string): Promise<File> {
    // This is a placeholder implementation. We will add file storage logic later.
    const newFile = this.fileRepository.create({
      ...uploadFileDto,
      name: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: file.path, // Placeholder URL
      companyId,
      uploadedBy: userId,
    });
    return this.fileRepository.save(newFile);
  }

  async getFiles(options: { entityType?: FileEntityType; entityId?: string; category?: FileCategory; companyId: string }): Promise<File[]> {
    return this.fileRepository.find({ where: options });
  }

  async getFile(id: string, companyId: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id, companyId } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    return file;
  }

  async updateFile(id: string, updateFileDto: UpdateFileDto, companyId: string): Promise<File> {
    const file = await this.getFile(id, companyId);
    const updatedFile = this.fileRepository.merge(file, updateFileDto);
    return this.fileRepository.save(updatedFile);
  }

  async deleteFile(id: string, companyId: string): Promise<void> {
    const file = await this.getFile(id, companyId);
    // We will add logic to delete the actual file from storage later.
    await this.fileRepository.remove(file);
  }
}
