import { Injectable } from '@nestjs/common';
import { EventsService } from '../../events/events.service';
import { UserStatus } from '../entities/enums/user-status.enum';
import { UserRole } from '../entities/enums/user-role.enum';
import { UserType } from '../entities/enums/user-type.enum';
import { EventUserType } from '@wanzo/shared/events/kafka-config';

@Injectable()
export class UserEventsHandler {
  constructor(private readonly eventsService: EventsService) {}

  async handleUserStatusChange(
    userId: string,
    previousStatus: UserStatus,
    newStatus: UserStatus,
    userType: UserType,
    changedBy: string,
    reason?: string,
  ): Promise<void> {
    await this.eventsService.publishUserStatusChanged({
      userId,
      previousStatus,
      newStatus,
      userType: this.mapUserTypeToEventUserType(userType),
      timestamp: new Date(),
      changedBy,
      reason,
    });
  }

  async handleUserRoleChange(
    userId: string,
    previousRole: UserRole,
    newRole: UserRole,
    userType: UserType,
    changedBy: string,
  ): Promise<void> {
    await this.eventsService.publishUserRoleChanged({
      userId,
      previousRole,
      newRole,
      userType: this.mapUserTypeToEventUserType(userType),
      timestamp: new Date(),
      changedBy,
    });
  }
  
  // Helper method to map UserType to EventUserType
  private mapUserTypeToEventUserType(userType: UserType): EventUserType {
    switch (userType) {
      case UserType.INTERNAL:
        return EventUserType.INTERNAL_ADMIN;
      case UserType.EXTERNAL:
        return EventUserType.SME_USER; // Default mapping, adjust as needed
      default:
        return EventUserType.SME_USER; // Fallback
    }
  }
}
