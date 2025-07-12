import { UserCreatedEvent as BaseUserCreatedEvent } from '@wanzo/shared/events/kafka-config';

export interface OrganizationDetails {
  id: string;
  name: string;
  initialPlan?: string;
  industry?: string;
  country?: string;
}

export interface ExtendedUserCreatedEvent extends BaseUserCreatedEvent {
  isOwner?: boolean;
  organizationDetails?: OrganizationDetails;
}
