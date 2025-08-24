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
    
    // Check for Authorization header (case insensitive)
    const authHeader = headers.authorization || headers.Authorization;
    if (authHeader) {
      const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      this.logger.log(`🔑 Authorization header found and will be forwarded: ${authValue.substring(0, 20)}...`);
    } else {
      this.logger.log(`❌ No Authorization header found - this may cause authentication issues`);
    }
    
    try {
      // Extract path after 'land/api/v1'
      const targetPath = path.replace('/land/api/v1', '');
      const targetUrl = `http://kiota-customer-service:3011${targetPath}`;
      
      this.logger.log(`📡 Forwarding to: ${targetUrl}`);
      
      // Prepare headers - ensure Authorization header is properly forwarded
      const forwardHeaders = {
        ...headers,
        host: 'kiota-customer-service:3011'
      };
      delete forwardHeaders['content-length'];
      
      // Ensure Authorization header is preserved (case sensitive handling)
      if (authHeader) {
        forwardHeaders['Authorization'] = Array.isArray(authHeader) ? authHeader[0] : authHeader;
        this.logger.log(`🔑 Authorization header set in forward headers`);
      }
      
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

  @All('accounting/api/v1/*')
  @ApiOperation({ 
    summary: 'Proxy to Accounting Service',
    description: 'Routes all requests starting with accounting/api/v1 to the accounting service'
  })
  @ApiResponse({ status: 200, description: 'Request successfully proxied' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async proxyToAccountingService(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { method, path, headers, body } = req;
    const startTime = Date.now();
    
    this.logger.log(`💰 ACCOUNTING SERVICE PROXY: ${method} ${path}`);
    this.logger.log(`📋 Headers received: ${JSON.stringify(Object.keys(headers))}`);
    
    // Check for Authorization header (case insensitive)
    const authHeader = headers.authorization || headers.Authorization;
    if (authHeader) {
      const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      this.logger.log(`🔑 Authorization header found and will be forwarded: ${authValue.substring(0, 20)}...`);
    } else {
      this.logger.log(`❌ No Authorization header found - this may cause authentication issues`);
    }
    
    try {
      // Extract path after 'accounting/api/v1' and add /v1 prefix for the accounting service
      const targetPath = path.replace('/accounting/api/v1', '/v1');
      const targetUrl = `http://kiota-accounting-service:3003${targetPath}`;
      
      this.logger.log(`📡 Forwarding to: ${targetUrl}`);
      
      // Prepare headers - ensure Authorization header is properly forwarded
      const forwardHeaders = {
        ...headers,
        host: 'kiota-accounting-service:3003'
      };
      delete forwardHeaders['content-length'];
      
      // Ensure Authorization header is preserved (case sensitive handling)
      if (authHeader) {
        forwardHeaders['Authorization'] = Array.isArray(authHeader) ? authHeader[0] : authHeader;
        this.logger.log(`🔑 Authorization header set in forward headers`);
      }
      
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
      this.logger.log(`✅ Accounting service responded: ${response.status} (${duration}ms)`);
      
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

  @All('accounting/*')
  @ApiOperation({ 
    summary: 'Proxy to Accounting Service (Short Path)',
    description: 'Routes all requests starting with accounting/ to the accounting service (backward compatibility)'
  })
  @ApiResponse({ status: 200, description: 'Request successfully proxied' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async proxyToAccountingServiceShort(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { method, path, headers, body } = req;
    const startTime = Date.now();
    
    this.logger.log(`💰 ACCOUNTING SERVICE PROXY (SHORT): ${method} ${path}`);
    this.logger.log(`📋 Headers received: ${JSON.stringify(Object.keys(headers))}`);
    
    // Check for Authorization header (case insensitive)
    const authHeader = headers.authorization || headers.Authorization;
    if (authHeader) {
      const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      this.logger.log(`🔑 Authorization header found and will be forwarded: ${authValue.substring(0, 20)}...`);
    } else {
      this.logger.log(`❌ No Authorization header found - this may cause authentication issues`);
    }
    
    try {
      // Extract path after 'accounting' and add /v1 prefix for the accounting service
      const targetPath = path.replace('/accounting', '/v1');
      const targetUrl = `http://kiota-accounting-service:3003${targetPath}`;
      
      this.logger.log(`📡 Forwarding to: ${targetUrl}`);
      
      // Prepare headers - ensure Authorization header is properly forwarded
      const forwardHeaders = {
        ...headers,
        host: 'kiota-accounting-service:3003'
      };
      delete forwardHeaders['content-length'];
      
      // Ensure Authorization header is preserved (case sensitive handling)
      if (authHeader) {
        forwardHeaders['Authorization'] = Array.isArray(authHeader) ? authHeader[0] : authHeader;
        this.logger.log(`🔑 Authorization header set in forward headers`);
      }
      
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
      this.logger.log(`✅ Accounting service responded: ${response.status} (${duration}ms)`);
      
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
        'ANY /land/api/v1/* - Customer service routes',
        'ANY /accounting/api/v1/* - Accounting service routes (full path)',
        'ANY /accounting/* - Accounting service routes (short path)'
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
