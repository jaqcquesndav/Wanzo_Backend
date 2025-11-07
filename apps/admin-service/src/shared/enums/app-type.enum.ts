/**
 * App Type Enum
 * Types of applications/features that consume tokens
 */
export enum AppType {
  TEXT_GENERATION = 'text-generation',
  IMAGE_GENERATION = 'image-generation',
  CHAT_COMPLETION = 'chat-completion',
  EMBEDDINGS = 'embeddings',
  TEXT_TO_SPEECH = 'text-to-speech',
  WEB_DASHBOARD = 'web-dashboard',
  MOBILE_APP = 'mobile-app',
  API_DIRECT = 'api-direct',
}
