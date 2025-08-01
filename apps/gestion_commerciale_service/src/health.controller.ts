import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({ 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        service: { type: 'string', example: 'app_mobile_service' },
        version: { type: 'string', example: '1.0.0' },
      }
    }
  })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'app_mobile_service',
      version: '1.0.0',
    };
  }
}
