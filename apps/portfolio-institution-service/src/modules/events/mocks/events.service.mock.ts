import { Injectable } from '@nestjs/common';

@Injectable()
export class EventsServiceMock {
  // Mock pour toutes les méthodes du service d'événements
  async publishUserStatusChanged(event: any): Promise<void> {}
  async publishUserRoleChanged(event: any): Promise<void> {}
  async publishSubscriptionChanged(event: any): Promise<void> {}
  async publishSubscriptionExpired(event: any): Promise<void> {}
  async publishTokenPurchase(event: any): Promise<void> {}
  async publishTokenUsage(event: any): Promise<void> {}
  async publishTokenAlert(event: any): Promise<void> {}
  
  // Mock pour les événements du portfolio
  async publishFundingRequestStatusChanged(event: any): Promise<void> {}
  async publishContractCreated(event: any): Promise<void> {}
  async publishContractStatusChanged(event: any): Promise<void> {}
  async publishContractRestructured(event: any): Promise<void> {}
  async publishDisbursementCompleted(event: any): Promise<void> {}
  async publishRepaymentReceived(event: any): Promise<void> {}
  async publishPaymentScheduleUpdated(event: any): Promise<void> {}
}
