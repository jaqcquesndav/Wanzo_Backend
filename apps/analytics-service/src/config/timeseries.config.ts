import { registerAs } from '@nestjs/config';

export default registerAs('timeseries', () => ({
  type: 'postgres',
  host: process.env.TIMESCALE_HOST || 'localhost',
  port: parseInt(process.env.TIMESCALE_PORT ?? '5432', 10),
  username: process.env.TIMESCALE_USERNAME || 'postgres',
  password: process.env.TIMESCALE_PASSWORD || 'root123',
  database: process.env.TIMESCALE_DATABASE || 'analytics-service',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
}));