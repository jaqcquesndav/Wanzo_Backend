import { EntityType, SubscriptionPlanType, SubscriptionStatusType } from './subscription-types';

export interface SubscriptionChangedEvent {
  subscriptionId: string;
  userId: string;
  entityId: string;
  entityType: EntityType;
  previousPlan?: SubscriptionPlanType;
  newPlan: SubscriptionPlanType;
  previousStatus?: SubscriptionStatusType;
  newStatus: SubscriptionStatusType;
  startDate: string;
  endDate: string;
  changedBy: string;
  timestamp: string;
}

export enum SubscriptionEventTopics {
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',
  SUBSCRIPTION_RENEWED = 'subscription.renewed',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription.payment.failed',
  SUBSCRIPTION_PLAN_CHANGED = 'subscription.plan.changed',
  SUBSCRIPTION_STATUS_CHANGED = 'subscription.status.changed',
}
