import { Injectable } from '@nestjs/common';
import { EventsService } from '../../events/events.service';
import { UserStatus } from '../entities/enums/user-status.enum';
import { UserRole } from '../entities/enums/user-role.enum';
import { UserType } from '../entities/enums/user-type.enum';

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
      userType,
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
      userType,
      timestamp: new Date(),
      changedBy,
    });
  }
}
