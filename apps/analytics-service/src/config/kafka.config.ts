import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => ({
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  clientId: process.env.KAFKA_CLIENT_ID || 'analytics-service',
  groupId: process.env.KAFKA_GROUP_ID || 'analytics-risk-group',
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_SASL_ENABLED === 'true' ? {
    mechanism: 'plain',
    username: process.env.KAFKA_SASL_USERNAME || '',
    password: process.env.KAFKA_SASL_PASSWORD || ''
  } : undefined,
  retry: {
    initialRetryTime: 100,
    retries: 8
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
}));
