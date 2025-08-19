export declare enum SubscriptionPlanType {
    FREE = "free",
    BASIC = "basic",
    PROFESSIONAL = "professional",
    PREMIUM = "premium",
    ENTERPRISE = "enterprise"
}
export declare enum SubscriptionStatusType {
    ACTIVE = "active",
    INACTIVE = "inactive",
    CANCELLED = "cancelled",
    PAST_DUE = "past_due",
    TRIAL = "trial",
    EXPIRED = "expired",
    SUSPENDED = "suspended"
}
export declare enum EntityType {
    PME = "pme",
    INSTITUTION = "institution"
}
export interface SubscriptionData {
    userId: string;
    entityId: string;
    entityType: EntityType;
    plan: SubscriptionPlanType;
    status: SubscriptionStatusType;
    startDate: Date;
    endDate?: Date;
    trialEndsAt?: Date;
    tokenBalance: number;
    tokensUsed: number;
    maxUsers?: number;
    features?: string[];
}
export interface TokenUsageHistory {
    date: Date;
    amount: number;
    operation: string;
    balance: number;
}
export interface SubscriptionAction {
    type: 'create' | 'update' | 'cancel' | 'renew' | 'suspend' | 'reactivate';
    subscriptionData: SubscriptionData;
    tokenUsage?: TokenUsageHistory;
    reason?: string;
    performedBy: string;
    timestamp: Date;
}
//# sourceMappingURL=subscription-types.d.ts.map