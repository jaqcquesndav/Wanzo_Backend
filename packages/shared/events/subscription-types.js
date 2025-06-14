"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityType = exports.SubscriptionStatusType = exports.SubscriptionPlanType = void 0;
var SubscriptionPlanType;
(function (SubscriptionPlanType) {
    SubscriptionPlanType["FREE"] = "free";
    SubscriptionPlanType["BASIC"] = "basic";
    SubscriptionPlanType["PROFESSIONAL"] = "professional";
    SubscriptionPlanType["PREMIUM"] = "premium";
    SubscriptionPlanType["ENTERPRISE"] = "enterprise";
})(SubscriptionPlanType || (exports.SubscriptionPlanType = SubscriptionPlanType = {}));
var SubscriptionStatusType;
(function (SubscriptionStatusType) {
    SubscriptionStatusType["ACTIVE"] = "active";
    SubscriptionStatusType["INACTIVE"] = "inactive";
    SubscriptionStatusType["CANCELLED"] = "cancelled";
    SubscriptionStatusType["PAST_DUE"] = "past_due";
    SubscriptionStatusType["TRIAL"] = "trial";
    SubscriptionStatusType["EXPIRED"] = "expired";
    SubscriptionStatusType["SUSPENDED"] = "suspended";
})(SubscriptionStatusType || (exports.SubscriptionStatusType = SubscriptionStatusType = {}));
var EntityType;
(function (EntityType) {
    EntityType["PME"] = "pme";
    EntityType["INSTITUTION"] = "institution";
})(EntityType || (exports.EntityType = EntityType = {}));
//# sourceMappingURL=subscription-types.js.map