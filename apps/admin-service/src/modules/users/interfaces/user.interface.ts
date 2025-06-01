export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  usersByRole: Record<string, number>;
  newUsersLast30Days: number;
}

export interface ActivityStatistics {
  totalLogins: number;
  failedLogins: number;
  mostActiveUsers: {
    userId: string;
    name: string;
    activityCount: number;
  }[];
  activityByType: Record<string, number>;
}

export interface CustomerAccount {
  id: string;
  name: string;
  type: string;
  status: string;
  primaryContactUserId?: string;
}
