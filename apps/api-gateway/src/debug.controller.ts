import { Controller, Get, All, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('debug')
@Controller()
export class DebugController {
  private readonly logger = new Logger(DebugController.name);

  constructor() {
    this.logger.log('🔍 DebugController initialized - This should appear in logs!');
  }

  @Get('debug')
  debug() {
    this.logger.log('Debug endpoint called!');
    return {
      message: 'API Gateway Debug Controller is working!',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    };
  }

  @Get('health')
  health() {
    this.logger.log('Health endpoint called from debug controller!');
    return {
      status: 'OK',
      service: 'API Gateway',
      timestamp: new Date().toISOString()
    };
  }

  @All('*')
  catchAll(@Req() req: Request, @Res() res: Response) {
    this.logger.log(`🚨 Catch-all triggered: ${req.method} ${req.path}`);
    res.status(200).json({
      message: 'Catch-all route working!',
      method: req.method,
      path: req.path,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  }
}
