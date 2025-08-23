import { Controller, All, Get, Req, Res, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import axios, { AxiosResponse } from 'axios';

@ApiTags('proxy')
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);
  
  constructor() {
    this.logger.log('🚀 ProxyController initialized - Ready to handle requests');
  }

  @Get('health')
  @ApiOperation({ summary: 'API Gateway Health Check' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    this.logger.log('🔍 Health check requested');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }

  @All('land/api/v1/*')
  @ApiOperation({ 
    summary: 'Proxy to Customer Service',
    description: 'Routes all requests starting with land/api/v1 to the customer service'
  })
  @ApiResponse({ status: 200, description: 'Request successfully proxied' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async proxyToCustomerService(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { method, path, headers, body } = req;
    const startTime = Date.now();
    
    this.logger.log(`🚀 CUSTOMER SERVICE PROXY: ${method} ${path}`);
    this.logger.log(`📋 Headers received: ${JSON.stringify(Object.keys(headers))}`);
    if (headers.authorization) {
      this.logger.log(`🔑 Authorization header found: ${headers.authorization.substring(0, 20)}...`);
    } else {
      this.logger.log(`❌ No Authorization header found`);
    }
    
    try {
      // Extract path after 'land/api/v1'
      const targetPath = path.replace('/land/api/v1', '');
      const targetUrl = `http://kiota-customer-service:3011${targetPath}`;
      
      this.logger.log(`📡 Forwarding to: ${targetUrl}`);
      
      // Prepare headers
      const forwardHeaders = {
        ...headers,
        host: 'kiota-customer-service:3011'
      };
      delete forwardHeaders['content-length'];
      
      // Make the request
      const response: AxiosResponse = await axios({
        method: method.toLowerCase() as any,
        url: targetUrl,
        headers: forwardHeaders,
        data: body,
        timeout: 30000,
        validateStatus: () => true
      });
      
      const duration = Date.now() - startTime;
      this.logger.log(`✅ Customer service responded: ${response.status} (${duration}ms)`);
      
      // Forward response headers
      if (response.headers) {
        Object.keys(response.headers).forEach(key => {
          if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
            res.set(key, response.headers[key]);
          }
        });
      }
      
      res.status(response.status).send(response.data);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleError(error, req, res, duration);
    }
  }

  @All('*')
  @ApiOperation({ 
    summary: 'Catch-All Route',
    description: 'Handles all requests that don\'t match specific routes'
  })
  async catchAll(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { method, path } = req;
    
    this.logger.warn(`🚫 CATCH-ALL: No route found for ${method} ${path}`);
    
    res.status(HttpStatus.NOT_FOUND).json({
      error: 'Route Not Found',
      message: `No service configured to handle path: ${path}`,
      path: path,
      method: method,
      timestamp: new Date().toISOString(),
      availableRoutes: [
        'GET /health - API Gateway health check',
        'ANY /land/api/v1/* - Customer service routes'
      ]
    });
  }

  private handleError(error: unknown, req: Request, res: Response, duration: number): void {
    const { method, path } = req;
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || HttpStatus.BAD_GATEWAY;
      const message = error.response?.data?.message || error.message || 'Service unavailable';
      
      this.logger.error(`❌ Proxy error: ${method} ${path} → ${status} (${duration}ms) - ${message}`);
      
      res.status(status).json({
        error: 'Proxy Error',
        message: message,
        path: path,
        targetService: error.config?.url || 'unknown',
        timestamp: new Date().toISOString()
      });
    } else {
      this.logger.error(`❌ Unexpected error: ${method} ${path} (${duration}ms)`, error);
      
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing the request',
        path: path,
        timestamp: new Date().toISOString()
      });
    }
  }
}
