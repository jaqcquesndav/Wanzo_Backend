import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancingRecord } from '../entities/financing-record.entity';
import { 
  FundingRequestAcknowledgedEvent,
  FundingRequestErrorEvent
} from '@wanzobe/shared';

@Injectable()
export class FundingRequestAcknowledgmentConsumerService {
  private readonly logger = new Logger(FundingRequestAcknowledgmentConsumerService.name);

  constructor(
    @InjectRepository(FinancingRecord)
    private readonly financingRecordRepository: Repository<FinancingRecord>,
  ) {}

  /**
   * Consomme les événements de confirmation de demande de financement depuis portfolio-institution
   */
  @EventPattern('funding.request.acknowledged')
  async handleFundingRequestAcknowledged(
    @Payload() message: any,
    @Ctx() context: KafkaContext
  ) {
    const startTime = Date.now();
    
    try {
      const data: FundingRequestAcknowledgedEvent['data'] = message.data || message;
      
      this.logger.log(
        `Received funding.request.acknowledged: financingRecordId=${data.financingRecordId}, fundingRequestId=${data.fundingRequestId}`
      );

      // Trouver le FinancingRecord correspondant
      const financingRecord = await this.financingRecordRepository.findOne({
        where: { id: data.financingRecordId }
      });

      if (!financingRecord) {
        this.logger.error(`FinancingRecord ${data.financingRecordId} not found`);
        return;
      }

      // Mettre à jour avec les informations du portfolio
      financingRecord.portfolioFundingRequestId = data.fundingRequestId;
      financingRecord.portfolioRequestNumber = data.requestNumber;

      await this.financingRecordRepository.save(financingRecord);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Successfully updated FinancingRecord ${data.financingRecordId} with portfolioFundingRequestId ${data.fundingRequestId} in ${processingTime}ms`
      );

      context.getMessage();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Failed to process funding.request.acknowledged: ${error.message} (failed after ${processingTime}ms)`,
        error.stack
      );
    }
  }

  /**
   * Consomme les événements d'erreur de demande de financement depuis portfolio-institution
   */
  @EventPattern('funding.request.error')
  async handleFundingRequestError(
    @Payload() message: any,
    @Ctx() context: KafkaContext
  ) {
    const startTime = Date.now();
    
    try {
      const data: FundingRequestErrorEvent['data'] = message.data || message;
      
      this.logger.error(
        `Received funding.request.error: financingRecordId=${data.financingRecordId}, errorCode=${data.errorCode}, errorMessage=${data.errorMessage}`
      );

      // Trouver le FinancingRecord correspondant
      const financingRecord = await this.financingRecordRepository.findOne({
        where: { id: data.financingRecordId }
      });

      if (!financingRecord) {
        this.logger.error(`FinancingRecord ${data.financingRecordId} not found for error handling`);
        return;
      }

      // TODO: Décider du comportement en cas d'erreur
      // Options:
      // 1. Marquer comme "failed" dans gestion_commerciale
      // 2. Conserver le statut actuel et logger l'erreur
      // 3. Envoyer une notification à l'utilisateur
      // Pour le moment, on log seulement

      this.logger.warn(
        `FinancingRecord ${data.financingRecordId} could not be processed by portfolio-institution: ${data.errorMessage}`
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(`Processed funding.request.error in ${processingTime}ms`);

      context.getMessage();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Failed to process funding.request.error: ${error.message} (failed after ${processingTime}ms)`,
        error.stack
      );
    }
  }
}
