import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import {
  SendMessageDto,
  MessageResponseDto,
  ConversationResponseDto,
  CreateConversationDto,
  ChatHealthResponseDto,
  MessageRole,
  MessageStatus,
  ConversationStatus
} from '../dto/chat.dto';

@Injectable()
export class PublicChatAdhaService {
  private readonly logger = new Logger(PublicChatAdhaService.name);
  private readonly openai: OpenAI;
  private systemContext: string;

  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly configService: ConfigService,
  ) {
    // Initialiser OpenAI
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    // Charger le contexte système
    this.loadSystemContext();
  }

  private loadSystemContext(): void {
    try {
      const contextPath = path.join(__dirname, '..', 'context', 'adha-system-context.txt');
      this.systemContext = fs.readFileSync(contextPath, 'utf8');
      this.logger.log('Contexte système Adha chargé avec succès');
    } catch (error) {
      this.logger.error('Erreur lors du chargement du contexte système:', error);
      this.systemContext = `
        Vous êtes Adha, l'assistant IA commercial de Wanzo, plateforme ERP pour PME/startups en RDC.
        Mission: Faciliter l'accès au financement par la valorisation des données d'entreprise.
        Restez professionnel, concis et orientez vers un humain pour les questions sensibles.
      `;
    }
  }

  async sendMessage(sendMessageDto: SendMessageDto, userId: string | null): Promise<MessageResponseDto> {
    try {
      let conversation: ChatConversation;

      // Récupérer ou créer la conversation
      if (sendMessageDto.conversationId) {
        // Pour les conversations existantes
        const whereClause = userId 
          ? { id: sendMessageDto.conversationId, userId }
          : { id: sendMessageDto.conversationId };
        
        const existingConversation = await this.conversationRepository.findOne({
          where: whereClause,
          relations: ['messages']
        });

        if (!existingConversation) {
          throw new NotFoundException('Conversation non trouvée');
        }
        conversation = existingConversation;
      } else {
        // Créer une nouvelle conversation (avec ou sans userId)
        conversation = this.conversationRepository.create({
          userId: userId || undefined,
          title: sendMessageDto.content.substring(0, 50) + '...',
          status: ConversationStatus.ACTIVE,
          lastMessageAt: new Date(),
        });
        conversation = await this.conversationRepository.save(conversation);
      }

      // Enregistrer le message utilisateur
      const userMessage = this.messageRepository.create({
        conversation,
        content: sendMessageDto.content,
        role: MessageRole.USER,
        status: MessageStatus.SENT,
        createdAt: new Date(),
      });
      await this.messageRepository.save(userMessage);

      // Préparer l'historique des messages pour OpenAI
      const messageHistory = await this.buildMessageHistory(conversation.id);

      // Appeler OpenAI pour obtenir la réponse d'Adha
      const adhaResponse = await this.getAdhaResponse(sendMessageDto.content, messageHistory);

      // Enregistrer la réponse d'Adha
      const assistantMessage = this.messageRepository.create({
        conversation,
        content: adhaResponse,
        role: MessageRole.ASSISTANT,
        status: MessageStatus.SENT,
        createdAt: new Date(),
      });
      await this.messageRepository.save(assistantMessage);

      // Mettre à jour la conversation
      conversation.lastMessageAt = new Date();
      await this.conversationRepository.save(conversation);

      return {
        id: assistantMessage.id,
        conversationId: conversation.id,
        content: adhaResponse,
        role: MessageRole.ASSISTANT,
        status: MessageStatus.SENT,
        createdAt: assistantMessage.createdAt.toISOString(),
      };

    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi du message:', error);
      throw new BadRequestException('Erreur lors du traitement du message');
    }
  }

  /**
   * Envoyer un message avec streaming SSE
   */
  async sendMessageStream(sendMessageDto: SendMessageDto, userId: string | null, res: Response): Promise<void> {
    try {
      let conversation: ChatConversation;

      // Récupérer ou créer la conversation
      if (sendMessageDto.conversationId) {
        const whereClause = userId 
          ? { id: sendMessageDto.conversationId, userId }
          : { id: sendMessageDto.conversationId };
        
        const existingConversation = await this.conversationRepository.findOne({
          where: whereClause,
          relations: ['messages']
        });

        if (!existingConversation) {
          res.write(`data: ${JSON.stringify({ type: 'error', message: 'Conversation non trouvée' })}\n\n`);
          res.end();
          return;
        }
        conversation = existingConversation;
      } else {
        conversation = this.conversationRepository.create({
          userId: userId || undefined,
          title: sendMessageDto.content.substring(0, 50) + '...',
          status: ConversationStatus.ACTIVE,
          lastMessageAt: new Date(),
        });
        conversation = await this.conversationRepository.save(conversation);
      }

      // Enregistrer le message utilisateur
      const userMessage = this.messageRepository.create({
        conversation,
        content: sendMessageDto.content,
        role: MessageRole.USER,
        status: MessageStatus.SENT,
        createdAt: new Date(),
      });
      await this.messageRepository.save(userMessage);

      // Envoyer l'ID de conversation au client
      res.write(`data: ${JSON.stringify({ 
        type: 'conversation', 
        conversationId: conversation.id 
      })}\n\n`);

      // Préparer l'historique des messages
      const messageHistory = await this.buildMessageHistory(conversation.id);

      // Stream la réponse d'OpenAI
      let fullResponse = '';
      await this.streamAdhaResponse(sendMessageDto.content, messageHistory, res, (chunk) => {
        fullResponse += chunk;
      });

      // Enregistrer la réponse complète d'Adha
      const assistantMessage = this.messageRepository.create({
        conversation,
        content: fullResponse || 'Je rencontre actuellement des difficultés techniques. Veuillez contacter un conseiller humain pour une assistance immédiate.',
        role: MessageRole.ASSISTANT,
        status: MessageStatus.SENT,
        createdAt: new Date(),
      });
      await this.messageRepository.save(assistantMessage);

      // Mettre à jour la conversation
      conversation.lastMessageAt = new Date();
      await this.conversationRepository.save(conversation);

      // Envoyer le message final avec l'ID
      res.write(`data: ${JSON.stringify({ 
        type: 'done', 
        messageId: assistantMessage.id,
        conversationId: conversation.id
      })}\n\n`);
      
      res.end();

    } catch (error) {
      this.logger.error('Erreur lors du streaming du message:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Erreur lors du traitement du message' 
      })}\n\n`);
      res.end();
    }
  }

  private async buildMessageHistory(conversationId: string): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> {
    const messages = await this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'ASC' },
      take: 20, // Limiter à 20 derniers messages
    });

    return messages.map(msg => ({
      role: msg.role === MessageRole.USER ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  private async getAdhaResponse(userMessage: string, messageHistory: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.systemContext,
        },
        ...messageHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
        messages,
        max_tokens: parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS', '1000')),
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      return completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez contacter un conseiller humain.';

    } catch (error) {
      this.logger.error('Erreur OpenAI:', error);
      return 'Je rencontre actuellement des difficultés techniques. Veuillez contacter un conseiller humain pour une assistance immédiate.';
    }
  }

  /**
   * Stream la réponse d'Adha via OpenAI avec SSE
   */
  private async streamAdhaResponse(
    userMessage: string, 
    messageHistory: OpenAI.Chat.ChatCompletionMessageParam[], 
    res: Response,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.systemContext,
        },
        ...messageHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const stream = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
        messages,
        max_tokens: parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS', '1000')),
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
        stream: true, // Enable streaming
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
          // Envoyer chaque token au client via SSE
          res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
        }
      }

    } catch (error) {
      this.logger.error('Erreur OpenAI streaming:', error);
      const errorMessage = 'Je rencontre actuellement des difficultés techniques. Veuillez contacter un conseiller humain pour une assistance immédiate.';
      onChunk(errorMessage);
      res.write(`data: ${JSON.stringify({ type: 'token', content: errorMessage })}\n\n`);
    }
  }

  async createConversation(createConversationDto: CreateConversationDto, userId: string | null): Promise<ConversationResponseDto> {
    try {
      const conversation = this.conversationRepository.create({
        userId: userId || undefined,
        title: createConversationDto.title,
        status: ConversationStatus.ACTIVE,
        lastMessageAt: new Date(),
      });

      const savedConversation = await this.conversationRepository.save(conversation);

      return {
        id: savedConversation.id,
        title: savedConversation.title || 'Nouvelle conversation',
        status: savedConversation.status,
        createdAt: savedConversation.createdAt.toISOString(),
        updatedAt: savedConversation.updatedAt.toISOString(),
        messageCount: 0,
        messages: [],
      };

    } catch (error) {
      this.logger.error('Erreur lors de la création de la conversation:', error);
      throw new BadRequestException('Erreur lors de la création de la conversation');
    }
  }

  async getConversation(conversationId: string, userId: string | null): Promise<ConversationResponseDto> {
    const whereClause = userId 
      ? { id: conversationId, userId }
      : { id: conversationId };
    
    const conversation = await this.conversationRepository.findOne({
      where: whereClause,
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    return {
      id: conversation.id,
      title: conversation.title || 'Conversation sans titre',
      status: conversation.status,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messageCount: conversation.messages?.length || 0,
      messages: conversation.messages?.map(message => ({
        id: message.id,
        conversationId: conversation.id,
        content: message.content,
        role: message.role,
        status: message.status,
        createdAt: message.createdAt.toISOString(),
      })) || [],
    };
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    // Supprimer les messages associés
    await this.messageRepository.delete({ conversation: { id: conversationId } });

    // Supprimer la conversation
    await this.conversationRepository.delete(conversationId);
  }

  async getUserConversations(userId: string): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationRepository.find({
      where: { userId },
      relations: ['messages'],
      order: { lastMessageAt: 'DESC' },
    });

    return conversations.map(conversation => ({
      id: conversation.id,
      title: conversation.title || 'Conversation sans titre',
      status: conversation.status,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messageCount: conversation.messages?.length || 0,
      messages: [],
    }));
  }

  async getHealth(): Promise<ChatHealthResponseDto> {
    try {
      // Vérifier la connexion à la base de données
      await this.conversationRepository.query('SELECT 1');

      // Vérifier la connexion OpenAI
      await this.openai.models.list();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          openai: 'connected',
          adha: 'ready',
        },
        version: '1.0.0',
      };

    } catch (error: any) {
      this.logger.error('Vérification de santé échouée:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'error',
          openai: 'error',
          adha: 'error',
        },
        version: '1.0.0',
        error: error?.message || 'Erreur inconnue',
      };
    }
  }
}