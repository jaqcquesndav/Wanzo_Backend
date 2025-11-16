import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancingRecord, FinancingRequestStatus } from '../entities/financing-record.entity';
import { 
  PortfolioEventTopics, 
  ContractCreatedEvent, 
  DisbursementCompletedEvent, 
  RepaymentReceivedEvent 
} from '@wanzobe/shared';

@Injectable()
export class PortfolioEventsConsumerService {
  private readonly logger = new Logger(PortfolioEventsConsumerService.name);

  constructor(
    @InjectRepository(FinancingRecord)
    private readonly financingRecordRepository: Repository<FinancingRecord>,
  ) {}

  /**
   * Écoute les événements de création de contrat depuis portfolio-institution-service
   * Met à jour le FinancingRecord avec les informations du contrat
   */
  @EventPattern(PortfolioEventTopics.CONTRACT_CREATED)
  async handleContractCreated(@Payload() data: ContractCreatedEvent, @Ctx() context: KafkaContext) {
    const startTime = Date.now();
    this.logger.log(`Received CONTRACT_CREATED event for contract ${data.id}`);

    try {
      // Utiliser fundingRequestId comme sourceRequestId
      const sourceRequestId = data.fundingRequestId;
      
      if (!sourceRequestId) {
        this.logger.warn(`No fundingRequestId in CONTRACT_CREATED event for contract ${data.id}`);
        return;
      }

      // Trouver la demande de financement correspondante
      const financingRecord = await this.financingRecordRepository.findOne({
        where: { id: sourceRequestId }
      });

      if (!financingRecord) {
        this.logger.warn(`FinancingRecord ${sourceRequestId} not found for contract ${data.id}`);
        return;
      }

      // Mettre à jour le statut et les informations du contrat
      financingRecord.status = FinancingRequestStatus.APPROVED;
      financingRecord.approvalDate = new Date(data.startDate);
      financingRecord.lastStatusUpdateDate = new Date();
      financingRecord.contractId = data.id;
      
      // Stocker des informations supplémentaires dans les notes
      financingRecord.notes = `${financingRecord.notes || ''}\nContract Number: ${data.contractNumber}`;

      await this.financingRecordRepository.save(financingRecord);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Successfully processed CONTRACT_CREATED event for FinancingRecord ${sourceRequestId} in ${processingTime}ms`
      );

      // Acknowledge message
      context.getMessage();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Failed to process CONTRACT_CREATED event: ${error.message} (failed after ${processingTime}ms)`,
        error.stack
      );
      // Ne pas throw pour éviter de bloquer le consumer
      // Le message sera considéré comme traité mais l'erreur est loggée
    }
  }

  /**
   * Écoute les événements de décaissement complété
   * Met à jour le FinancingRecord avec le statut DISBURSED
   */
  @EventPattern(PortfolioEventTopics.DISBURSEMENT_COMPLETED)
  async handleDisbursementCompleted(@Payload() data: DisbursementCompletedEvent, @Ctx() context: KafkaContext) {
    const startTime = Date.now();
    this.logger.log(`Received DISBURSEMENT_COMPLETED event for contract ${data.contractId}`);

    try {
      // Chercher par contractId directement
      const financingRecord = await this.financingRecordRepository.findOne({
        where: { contractId: data.contractId }
      });

      if (!financingRecord) {
        this.logger.warn(`No FinancingRecord found for contract ${data.contractId}`);
        return;
      }

      // Mettre à jour le statut
      financingRecord.status = FinancingRequestStatus.DISBURSED;
      financingRecord.disbursementDate = new Date(data.disbursementDate);
      financingRecord.lastStatusUpdateDate = new Date();

      await this.financingRecordRepository.save(financingRecord);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Successfully processed DISBURSEMENT_COMPLETED event for FinancingRecord ${financingRecord.id} in ${processingTime}ms`
      );

      context.getMessage();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Failed to process DISBURSEMENT_COMPLETED event: ${error.message} (failed after ${processingTime}ms)`,
        error.stack
      );
    }
  }

  /**
   * Écoute les événements de remboursement reçu
   * Met à jour le FinancingRecord si le crédit est complètement remboursé
   */
  @EventPattern(PortfolioEventTopics.REPAYMENT_RECEIVED)
  async handleRepaymentReceived(@Payload() data: RepaymentReceivedEvent, @Ctx() context: KafkaContext) {
    const startTime = Date.now();
    this.logger.log(`Received REPAYMENT_RECEIVED event for contract ${data.contractId}`);

    try {
      // Chercher par contractId directement
      const financingRecord = await this.financingRecordRepository.findOne({
        where: { contractId: data.contractId }
      });

      if (!financingRecord) {
        this.logger.warn(`No FinancingRecord found for contract ${data.contractId}`);
        return;
      }

      // Vérifier si tous les schedule items sont payés (status = 'paid')
      const allPaid = data.scheduleItemsAffected.every(item => item.status === 'paid');
      
      if (allPaid && data.scheduleItemsAffected.length > 0) {
        financingRecord.status = FinancingRequestStatus.COMPLETED;
        financingRecord.lastStatusUpdateDate = new Date();
        
        await this.financingRecordRepository.save(financingRecord);
        
        this.logger.log(
          `FinancingRecord ${financingRecord.id} marked as COMPLETED after full repayment`
        );
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Successfully processed REPAYMENT_RECEIVED event in ${processingTime}ms`
      );

      context.getMessage();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Failed to process REPAYMENT_RECEIVED event: ${error.message} (failed after ${processingTime}ms)`,
        error.stack
      );
    }
  }
}
