import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { LoadBalancerService } from './services/load-balancer.service';
import { RequestTrackerService } from './services/request-tracker.service';
import { RouteResolverService } from './services/route-resolver.service';
import { MonitoringModule } from '../../monitoring/monitoring.module';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsRouteGuard } from './guards/analytics-route.guard';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    MonitoringModule,
  ],
  controllers: [ProxyController],
  providers: [
    ProxyService,
    CircuitBreakerService,
    LoadBalancerService,
    RequestTrackerService,
    RouteResolverService,
    AnalyticsRouteGuard,
  ],
  exports: [ProxyService],
})
export class ProxyModule {}
