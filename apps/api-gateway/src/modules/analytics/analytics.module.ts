import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsAccessMiddleware } from './middleware/analytics-access.middleware';
import { AnalyticsAccessController } from './analytics-access.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AnalyticsAccessController],
  providers: [],
  exports: [],
})
export class AnalyticsModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the analytics access middleware to all routes starting with /analytics
    consumer
      .apply(AnalyticsAccessMiddleware)
      .forRoutes({ path: 'analytics*', method: RequestMethod.ALL });
  }
}
