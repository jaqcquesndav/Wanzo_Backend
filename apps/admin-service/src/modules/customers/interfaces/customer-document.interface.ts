import { CustomerDocumentDto } from '../dtos';
import { User } from '@/modules/users/entities/user.entity';

/**
 * Interface for document-related methods added to CustomersService
 */
export interface CustomerDocumentMethods {
  /**
   * Approve a customer document
   * @param customerId The customer ID
   * @param documentId The document ID
   * @param approveDto The approval data
   * @param user The user performing the action
   */
  approveDocument(
    customerId: string, 
    documentId: string, 
    approveDto: any, 
    user: User
  ): Promise<CustomerDocumentDto>;

  /**
   * Reject a customer document
   * @param customerId The customer ID
   * @param documentId The document ID
   * @param rejectDto The rejection data
   * @param user The user performing the action
   */
  rejectDocument(
    customerId: string, 
    documentId: string, 
    rejectDto: any, 
    user: User
  ): Promise<CustomerDocumentDto>;
}
