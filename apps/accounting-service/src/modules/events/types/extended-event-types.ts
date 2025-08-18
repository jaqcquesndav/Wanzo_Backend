import { UserCreatedEvent as BaseUserCreatedEvent } from '@wanzobe/shared/events/kafka-config';

export interface OrganizationDetails {
  id: string;
  name: string;
  initialPlan?: string;
  industry?: string;
  country?: string;
}

export interface ExtendedUserCreatedEvent extends BaseUserCreatedEvent {
  userId: string;
  email: string;
  timestamp: string;
  isOwner?: boolean;
  organizationDetails?: OrganizationDetails;
}
