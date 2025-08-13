  // This file will be imported by CustomersService. 
// It contains methods related to customer document management.
import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerDocument, DocumentStatus } from '../entities/document.entity';
import { Repository } from 'typeorm';
import { EventsService } from '../../events/events.service';
import { CustomerDocumentDto } from '../dtos';
import { User } from '@/modules/users/entities/user.entity';

// Export functions that will be added to the CustomersService class
export const documentMethods = {
  /**
   * Approve a document
   */
  async approveDocument(
    this: any,
    customerId: string, 
    documentId: string, 
    approveDto: any, 
    user: User
  ): Promise<CustomerDocumentDto> {
    // Find the document
    const document = await this.documentsRepository.findOne({
      where: { 
        id: documentId, 
        customerId 
      }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found for customer ${customerId}`);
    }

    // Update the document status
    document.status = DocumentStatus.APPROVED;
    document.reviewedBy = user.id;
    document.reviewedAt = new Date();
    document.reviewComments = approveDto.comments || 'Document approved';

    // Save the document
    const updatedDocument = await this.documentsRepository.save(document);

    // Create activity record for document approval
    await this.createActivity(
      customerId,
      'document',
      'approved',
      `Document ${document.fileName} approved by ${user.name}`,
      {
        documentId,
        documentType: document.type
      }
    );

    // Emit event for document approval
    this.eventsService.emit('customer.document.approved', {
      customerId,
      documentId,
      documentType: document.type,
      reviewer: user.id
    });

    return this.mapDocumentToDto(updatedDocument);
  },

  /**
   * Reject a document
   */
  async rejectDocument(
    this: any,
    customerId: string, 
    documentId: string, 
    rejectDto: any, 
    user: User
  ): Promise<CustomerDocumentDto> {
    // Find the document
    const document = await this.documentsRepository.findOne({
      where: { 
        id: documentId, 
        customerId 
      }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found for customer ${customerId}`);
    }

    // Update the document status
    document.status = DocumentStatus.REJECTED;
    document.reviewedBy = user.id;
    document.reviewedAt = new Date();
    document.reviewComments = rejectDto.reason + (rejectDto.comments ? ` - ${rejectDto.comments}` : '');

    // Save the document
    const rejectedDocument = await this.documentsRepository.save(document);

    // Create activity record for document rejection
    await this.createActivity(
      customerId,
      'document',
      'rejected',
      `Document ${document.fileName} rejected: ${rejectDto.reason}`,
      {
        documentId,
        documentType: document.type
      }
    );

    // Emit event for document rejection
    this.eventsService.emit('customer.document.rejected', {
      customerId,
      documentId,
      documentType: document.type,
      reason: rejectDto.reason,
      reviewer: user.id
    });

    return this.mapDocumentToDto(rejectedDocument);
  }
};
