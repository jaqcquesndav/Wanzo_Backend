import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatAttachment, AttachmentStatus } from '../entities/chat-attachment.entity';
import { FileService, StoredFile } from '../../files/services/file.service';

@Injectable()
export class ChatAttachmentService {
  private readonly logger = new Logger(ChatAttachmentService.name);

  constructor(
    @InjectRepository(ChatAttachment)
    private attachmentRepository: Repository<ChatAttachment>,
    private fileService: FileService,
  ) {}

  async saveAttachment(
    chatId: string,
    messageId: string,
    file: Express.Multer.File,
    uploadedByUserId: string, // Changed from User object to userId string
    companyId: string,
  ): Promise<ChatAttachment> {
    let storedFile: StoredFile;
    try {
      // Store files in a subdirectory structure: companyId/chatId/filename
      storedFile = await this.fileService.saveFile(file, `attachments/${companyId}/${chatId}`);
    } catch (error: any) {
      this.logger.error(`Failed to save file for chat ${chatId}, message ${messageId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to store attachment file.');
    }

    const attachment = this.attachmentRepository.create({
      chatId,
      messageId,
      companyId, // Added companyId
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: storedFile.path,
      uploadedByUserId, // Storing userId string
      status: AttachmentStatus.UPLOADED, // Using new enum value
    });

    try {
      await this.attachmentRepository.save(attachment);
      this.logger.log(`Attachment record created for ${file.originalname}, ID: ${attachment.id}`);
      return attachment;
    } catch (error: any) {
      this.logger.error(`Failed to save attachment record for ${file.originalname}: ${error.message}`, error.stack);
      try {
        await this.fileService.deleteFile(storedFile.path);
        this.logger.warn(`Orphaned file ${storedFile.path} deleted after DB save failure.`);
      } catch (deleteError: any) {
        this.logger.error(`Failed to delete orphaned file ${storedFile.path}: ${deleteError.message}`, deleteError.stack);
      }
      throw new InternalServerErrorException('Failed to save attachment metadata.');
    }
  }

  async getAttachmentById(id: string, companyId: string): Promise<ChatAttachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id, companyId }, // companyId is now a valid field
    });
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found for company ${companyId}`);
    }
    return attachment;
  }

  async getAttachmentsForMessage(messageId: string, companyId: string): Promise<ChatAttachment[]> {
    return this.attachmentRepository.find({
      where: { messageId, companyId }, // companyId is now a valid field
    });
  }

  async getAttachmentsByChatId(chatId: string, companyId: string): Promise<ChatAttachment[]> {
    return this.attachmentRepository.find({
      where: { chatId, companyId },
    });
  }

  async processAttachmentForAI(attachmentId: string, companyId: string): Promise<{ id: string; type: string; content: string; fileName: string }> {
    this.logger.log(`Processing attachment ${attachmentId} for AI for company ${companyId}`);
    const attachment = await this.getAttachmentById(attachmentId, companyId);

    if (!attachment.filePath) {
      this.logger.error(`Attachment ${attachmentId} has no file path.`);
      throw new InternalServerErrorException('Attachment file path is missing.');
    }

    let content: string;
    try {
      content = await this.fileService.readFileAsBase64(attachment.filePath);
    } catch (error: any) {
      this.logger.error(`Failed to read file content for attachment ${attachmentId} from path ${attachment.filePath}: ${error.message}`, error.stack);
      // Optionally update status to PROCESSING_FAILED before throwing
      await this.updateAttachmentStatus(attachmentId, AttachmentStatus.PROCESSING_FAILED, companyId, `Failed to read file: ${error.message}`);
      throw new InternalServerErrorException('Failed to read attachment content for AI processing.');
    }

    let type = 'unknown';
    if (attachment.mimeType) {
      if (attachment.mimeType.startsWith('image/')) {
        type = 'image';
      } else if (attachment.mimeType === 'application/pdf') {
        type = 'pdf';
      } else if (
        attachment.mimeType === 'application/vnd.ms-excel' ||
        attachment.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        attachment.mimeType === 'text/csv'
      ) {
        type = 'spreadsheet';
      } else if (attachment.mimeType.startsWith('text/')) {
        type = 'text';
      }
    }
    // Update status to PROCESSED_FOR_AI after successful processing
    await this.updateAttachmentStatus(attachmentId, AttachmentStatus.PROCESSED_FOR_AI, companyId);
    this.logger.log(`Attachment ${attachmentId} processed. Type: ${type}, Original Filename: ${attachment.fileName}`);
    return { 
      id: attachment.id,
      type, 
      content, 
      fileName: attachment.fileName 
    };
  }

  async updateAttachmentStatus(id: string, status: AttachmentStatus, companyId: string, failureReason?: string): Promise<ChatAttachment> {
    const attachment = await this.getAttachmentById(id, companyId);
    attachment.status = status;
    attachment.processedAt = new Date(); // Update processedAt timestamp
    // if (failureReason && status === AttachmentStatus.PROCESSING_FAILED) { // Optional: store failure reason
    //   attachment.metadata = { ...attachment.metadata, failureReason }; 
    // }
    return this.attachmentRepository.save(attachment);
  }

  async deleteAttachment(id: string, companyId: string): Promise<void> {
    const attachment = await this.getAttachmentById(id, companyId);
    try {
      await this.fileService.deleteFile(attachment.filePath);
      await this.attachmentRepository.remove(attachment);
      this.logger.log(`Attachment ${id} and its file ${attachment.filePath} deleted successfully.`);
    } catch (error: any) {
      this.logger.error(`Error deleting attachment ${id} or its file ${attachment.filePath}: ${error.message}`, error.stack);
      // Optionally update status to DELETED or handle differently
      throw new InternalServerErrorException('Failed to delete attachment.');
    }
  }
}
