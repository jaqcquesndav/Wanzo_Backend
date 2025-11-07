import { Controller, Post, Body, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScopesGuard } from '../../auth/scopes.guard';
import { Scopes } from '../../auth/scopes.decorator';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly svc: BlockchainService) {}

  // Endpoint intent:
  // - anchor: anchor a computed SHA-256 (from base64 payload) to Fabric
  // - anchor-cid: anchor an existing IPFS CID with optional provided hash
  // - verify: check latest anchor for a refId (deprecated query param variant kept for compatibility)

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post('anchor')
  @Scopes('blockchain:write')
  async anchor(@Body() dto: { type: string; refId: string; dataBase64?: string }) {
    return this.svc.anchor(dto);
  }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Get('verify')
  @Scopes('blockchain:read')
  @ApiOperation({ summary: 'Deprecated: use GET /blockchain/verify/:refId', description: 'This endpoint is deprecated. Prefer path parameter variant.', deprecated: true })
  async verify(@Query('refId') refId: string) {
    return this.svc.verify(refId);
  }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Get('verify/:refId')
  @Scopes('blockchain:read')
  async verifyByParam(@Param('refId') refId: string) {
    return this.svc.verify(refId);
  }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post('anchor-cid')
  @Scopes('blockchain:write')
  async anchorCid(@Body() dto: { type: string; refId: string; cid: string; sha256?: string }) {
    return this.svc.anchorCid(dto as any);
  }
}
