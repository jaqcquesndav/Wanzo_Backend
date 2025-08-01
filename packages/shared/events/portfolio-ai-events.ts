/**
 * Définition des événements liés à l'IA pour le module Portfolio
 */

import { SharedUserRole } from './adha-events';

/**
 * Types d'analyse de portefeuille disponibles
 */
export enum PortfolioAnalysisType {
  FINANCIAL = 'financial',
  MARKET = 'market',
  OPERATIONAL = 'operational',
  RISK = 'risk',
}

/**
 * Sujets Kafka pour les événements IA du portfolio
 */
export enum PortfolioAIEventTopics {
  ANALYSIS_REQUEST = 'portfolio.analysis.request',
  ANALYSIS_RESPONSE = 'portfolio.analysis.response',
  CHAT_MESSAGE = 'portfolio.chat.message',
  CHAT_RESPONSE = 'portfolio.chat.response',
}

/**
 * Événement pour demander une analyse de portefeuille à Adha AI
 */
export interface PortfolioAnalysisRequestEvent {
  id: string;
  portfolioId: string;
  institutionId: string;
  userId: string;
  userRole: SharedUserRole;
  timestamp: string;
  analysisTypes: PortfolioAnalysisType[];
  contextInfo: {
    source: 'portfolio_institution';
    mode: 'analysis';
    portfolioType: string;
    [key: string]: any;
  };
}

/**
 * Réponse d'une analyse de portefeuille par Adha AI
 */
export interface PortfolioAnalysisResponseEvent {
  requestId: string;
  portfolioId: string;
  institutionId: string;
  timestamp: string;
  analyses: {
    [key in PortfolioAnalysisType]?: {
      indicators?: Record<string, number | string>;
      findings?: string[];
      status?: string;
      error?: string;
    };
  };
  recommendations: string[];
  metadata: {
    processed_by: string;
    [key: string]: any;
  };
}

/**
 * Événement pour envoyer un message de chat à Adha AI
 */
export interface ChatMessageEvent {
  id: string;
  chatId: string;
  userId: string;
  userRole: SharedUserRole;
  content: string;
  timestamp: string;
  contextInfo: {
    source: 'portfolio_institution';
    mode: 'chat';
    institutionId?: string;
    portfolioId?: string;
    [key: string]: any;
  };
}

/**
 * Réponse à un message de chat par Adha AI
 */
export interface ChatMessageResponseEvent {
  requestId: string;
  chatId: string;
  content: string;
  timestamp: string;
  metadata: {
    processed_by: string;
    context_used: string[];
    [key: string]: any;
  };
}
