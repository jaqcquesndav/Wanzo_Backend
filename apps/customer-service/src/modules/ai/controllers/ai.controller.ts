import { Controller, Post, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { AiService } from '../services/ai.service'; // Temporairement commenté
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

interface ChatRequestDto {
  message: string;
  context?: string;
  conversationId?: string;
}

interface TranscribeRequestDto {
  audioUrl: string;
  language?: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('land/api/v1/ai')
export class AiController {
  // constructor(private readonly aiService: AiService) {} // Temporairement commenté
  constructor() {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Chat avec l\'IA' })
  @ApiResponse({ status: 200, description: 'Réponse de l\'IA générée avec succès' })
  async chat(
    @Body() chatRequest: ChatRequestDto,
    @Req() req: any
  ): Promise<{ success: boolean; data: { response: string; conversationId: string } }> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Réponse simulée - TODO: Intégrer le service IA réel
    const response = {
      response: `Bonjour ! Voici une réponse simulée à votre message: "${chatRequest.message}". Cette fonctionnalité sera implémentée avec l'intégration d'un service d'IA.`,
      conversationId: chatRequest.conversationId || `conv_${Date.now()}`
    };
    
    return {
      success: true,
      data: response
    };
  }

  @Post('transcribe')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Transcription audio' })
  @ApiResponse({ status: 200, description: 'Audio transcrit avec succès' })
  async transcribe(
    @Body() transcribeRequest: TranscribeRequestDto,
    @Req() req: any
  ): Promise<{ success: boolean; data: { transcription: string; confidence: number } }> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Réponse simulée - TODO: Intégrer le service de transcription réel
    const transcription = {
      transcription: `Transcription simulée pour le fichier audio: ${transcribeRequest.audioUrl}. Cette fonctionnalité sera implémentée avec l'intégration d'un service de transcription.`,
      confidence: 0.95
    };
    
    return {
      success: true,
      data: transcription
    };
  }
}
