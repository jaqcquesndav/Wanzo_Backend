"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPlanType = exports.EntityType = exports.SubscriptionStatusType = exports.InstitutionStatusType = exports.EventUserType = exports.InstitutionEventTopics = exports.UserEventTopics = exports.getKafkaConfig = void 0;
const microservices_1 = require("@nestjs/microservices");
const subscription_types_1 = require("./subscription-types");
Object.defineProperty(exports, "EntityType", { enumerable: true, get: function () { return subscription_types_1.EntityType; } });
Object.defineProperty(exports, "SubscriptionPlanType", { enumerable: true, get: function () { return subscription_types_1.SubscriptionPlanType; } });
Object.defineProperty(exports, "SubscriptionStatusType", { enumerable: true, get: function () { return subscription_types_1.SubscriptionStatusType; } });
const getKafkaConfig = (configService) => {
    return {
        transport: microservices_1.Transport.KAFKA,
        options: {
            client: {
                clientId: configService.get('KAFKA_CLIENT_ID'),
                brokers: [configService.get('KAFKA_BROKER', 'localhost:9092')],
                ssl: configService.get('KAFKA_SSL', false),
            },
            consumer: {
                groupId: configService.get('KAFKA_GROUP_ID', 'wanzo-backend'),
                allowAutoTopicCreation: true,
            },
        },
    };
};
exports.getKafkaConfig = getKafkaConfig;
var UserEventTopics;
(function (UserEventTopics) {
    UserEventTopics["USER_CREATED"] = "user.created";
    UserEventTopics["USER_UPDATED"] = "user.updated";
    UserEventTopics["USER_STATUS_CHANGED"] = "user.status.changed";
    UserEventTopics["USER_ROLE_CHANGED"] = "user.role.changed";
    UserEventTopics["USER_DELETED"] = "user.deleted";
    UserEventTopics["SUBSCRIPTION_CHANGED"] = "subscription.changed";
    UserEventTopics["SUBSCRIPTION_EXPIRED"] = "subscription.expired";
    UserEventTopics["TOKEN_PURCHASE"] = "token.purchase";
    UserEventTopics["TOKEN_USAGE"] = "token.usage";
    UserEventTopics["TOKEN_ALERT"] = "token.alert";
    UserEventTopics["DATA_SHARING_CONSENT_CHANGED"] = "data.sharing.consent.changed";
})(UserEventTopics || (exports.UserEventTopics = UserEventTopics = {}));
var InstitutionEventTopics;
(function (InstitutionEventTopics) {
    InstitutionEventTopics["INSTITUTION_CREATED"] = "institution.created";
    InstitutionEventTopics["INSTITUTION_PROFILE_UPDATED"] = "institution.profile.updated";
    InstitutionEventTopics["INSTITUTION_STATUS_CHANGED"] = "institution.status.changed";
})(InstitutionEventTopics || (exports.InstitutionEventTopics = InstitutionEventTopics = {}));
var EventUserType;
(function (EventUserType) {
    EventUserType["SME_OWNER"] = "SME_OWNER";
    EventUserType["SME_USER"] = "SME_USER";
    EventUserType["INSTITUTION_ADMIN"] = "INSTITUTION_ADMIN";
    EventUserType["INSTITUTION_USER"] = "INSTITUTION_USER";
    EventUserType["INTERNAL_ADMIN"] = "INTERNAL_ADMIN";
    EventUserType["INTERNAL_STAFF"] = "INTERNAL_STAFF";
})(EventUserType || (exports.EventUserType = EventUserType = {}));
var InstitutionStatusType;
(function (InstitutionStatusType) {
    InstitutionStatusType["PENDING_VERIFICATION"] = "pending_verification";
    InstitutionStatusType["ACTIVE"] = "active";
    InstitutionStatusType["INACTIVE"] = "inactive";
    InstitutionStatusType["SUSPENDED"] = "suspended";
    InstitutionStatusType["UNDER_REVIEW"] = "under_review";
    InstitutionStatusType["CLOSED"] = "closed";
})(InstitutionStatusType || (exports.InstitutionStatusType = InstitutionStatusType = {}));
//# sourceMappingURL=kafka-config.js.map