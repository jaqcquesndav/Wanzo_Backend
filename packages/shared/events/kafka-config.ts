import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EntityType, SubscriptionPlanType, SubscriptionStatusType } from './subscription-types';

export const getKafkaConfig = (configService: ConfigService): KafkaOptions => {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get<string>('KAFKA_CLIENT_ID'),
        brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
        ssl: configService.get<boolean>('KAFKA_SSL', false),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'wanzo-backend'),
        allowAutoTopicCreation: true,
      },
    },
  };
};

export enum UserEventTopics {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_STATUS_CHANGED = 'user.status.changed',
  USER_ROLE_CHANGED = 'user.role.changed',
  USER_DELETED = 'user.deleted',
  SUBSCRIPTION_CHANGED = 'subscription.changed',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',
  TOKEN_PURCHASE = 'token.purchase',
  TOKEN_USAGE = 'token.usage',
  TOKEN_ALERT = 'token.alert',
}

export interface UserStatusChangedEvent {
  userId: string;
  previousStatus: string;
  newStatus: string;
  userType: string;
  timestamp: Date;
  changedBy: string;
  reason?: string;
}

export interface UserRoleChangedEvent {
  userId: string;
  previousRole: string;
  newRole: string;
  userType: string;
  timestamp: Date;
  changedBy: string;
}

export interface SubscriptionChangedEvent {
  userId: string;
  entityId: string; // Company or institution ID
  entityType: EntityType;
  previousPlan?: SubscriptionPlanType;
  newPlan: SubscriptionPlanType;
  status: SubscriptionStatusType;
  expiresAt?: Date;
  timestamp: Date;
  changedBy: string;
  reason?: string;
}

export interface TokenTransactionEvent {
  userId: string;
  entityId: string;
  entityType: EntityType;
  amount: number;
  operation: 'purchase' | 'use' | 'refund' | 'expire' | 'alert'; // Added 'alert'
  currentBalance: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}
