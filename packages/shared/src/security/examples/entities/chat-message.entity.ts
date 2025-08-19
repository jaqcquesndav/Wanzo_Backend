/**
 * Entity representing a chat message in the system
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export class ChatMessage {
  id!: string;
  
  chatId!: string;
  
  role!: MessageRole;
  
  content!: string;
  
  source?: string;
  
  metadata?: Record<string, any>;
  
  createdAt!: Date;
  
  updatedAt!: Date;
}
