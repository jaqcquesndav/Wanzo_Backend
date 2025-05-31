import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AxiosError, AxiosResponse } from 'axios';

@ApiTags('proxy')
@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  @ApiOperation({ summary: 'Forward request to appropriate service' })
  async handleRequest(@Req() req: Request, @Res() res: Response) {
    try {
      const response: AxiosResponse = await this.proxyService.forwardRequest(
        req.path,
        req.method,
        req.headers,
        req.body
      );

      res.status(response.status)
         .set(response.headers)
         .send(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      res.status(axiosError.response?.status || 500)
         .send(axiosError.response?.data || { message: 'Internal server error' });
    }
  }
}
