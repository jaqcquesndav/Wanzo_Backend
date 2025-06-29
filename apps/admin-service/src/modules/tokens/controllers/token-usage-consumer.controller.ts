import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TokenUsageEvent } from '@wanzo/shared/events/kafka-config';
import { TokensService } from '../../tokens/services/tokens.service';

@Controller()
export class TokenUsageConsumerController {
  constructor(private readonly tokensService: TokensService) {}

  @MessagePattern('token.usage')
  async handleTokenUsage(@Payload() event: TokenUsageEvent) {
    // Exemple d'event attendu :
    // {
    //   type: 'token_usage',
    //   user_id, company_id, institution_id, tokens_used, conversation_id, mode, timestamp
    // }
    // Logique :
    // 1. Créer un enregistrement TokenUsage
    // 2. Mettre à jour le compteur PME/institution selon company_id/institution_id
    // 3. Appliquer la logique d'abonnement si besoin
    await this.tokensService.recordTokenUsageFromEvent(event);
  }
}
