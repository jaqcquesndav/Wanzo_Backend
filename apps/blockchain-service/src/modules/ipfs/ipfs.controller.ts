import { Body, Controller, Get, Post, Query, UseGuards, Param } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IpfsService } from './ipfs.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScopesGuard } from '../../auth/scopes.guard';
import { Scopes } from '../../auth/scopes.decorator';

class UploadDto {
  dataBase64!: string;
  filename?: string;
  mime?: string;
}

@ApiTags('ipfs')
@Controller('ipfs')
export class IpfsController {
  constructor(private readonly ipfs: IpfsService) {}

  // Note about duplicates:
  // Historical endpoints (upload-file, stat, get-file) are kept for backward compatibility
  // but are deprecated. Prefer the RESTful routes under /ipfs/files for all new integrations.

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post('upload-file')
  @Scopes('ipfs:write')
  @ApiOperation({ summary: 'Deprecated: use POST /ipfs/files', deprecated: true, description: 'Legacy upload endpoint. Prefer POST /ipfs/files with the same payload.' })
  @ApiBody({ schema: { type: 'object', properties: { dataBase64: { type: 'string' }, filename: { type: 'string' }, mime: { type: 'string' } }, required: ['dataBase64'] } })
  async upload(
    @Body('dataBase64') dataBase64: string,
    @Body('filename') filename?: string,
    @Body('mime') mime?: string,
  ) {
    return this.ipfs.add(dataBase64, filename, mime);
  }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Get('stat')
  @Scopes('ipfs:read')
  @ApiOperation({ summary: 'Deprecated: use GET /ipfs/files/:cid/stat', deprecated: true })
  async stat(@Query('cid') cid: string) {
    try {
      return await this.ipfs.stat(cid);
    } catch {
      // Fallback: compute size via cat if stat isn't allowed
      const data = await this.ipfs.cat(cid);
      const size = Buffer.from(data.dataBase64, 'base64').length;
      return { Key: cid, Size: size } as any;
    }
  }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Get('get-file')
  @Scopes('ipfs:read')
  @ApiOperation({ summary: 'Deprecated: use GET /ipfs/files/:cid', deprecated: true })
  async get(@Query('cid') cid: string) {
    return this.ipfs.cat(cid);
  }

  // RESTful aliases
  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post('files')
  @Scopes('ipfs:write')
  @ApiOperation({ summary: 'Upload file to IPFS (RESTful)' })
  @ApiBody({ schema: { type: 'object', properties: { dataBase64: { type: 'string' }, filename: { type: 'string' }, mime: { type: 'string' } }, required: ['dataBase64'] } })
  async createFile(
    @Body('dataBase64') dataBase64: string,
    @Body('filename') filename?: string,
    @Body('mime') mime?: string,
  ) {
    return this.ipfs.add(dataBase64, filename, mime);
  }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Get('files/:cid')
  @Scopes('ipfs:read')
  @ApiOperation({ summary: 'Get file content by CID (RESTful)' })
  async getFileByCid(@Param('cid') cid: string) {
    return this.ipfs.cat(cid);
  }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Get('files/:cid/stat')
  @Scopes('ipfs:read')
  @ApiOperation({ summary: 'Get file stat by CID (RESTful)' })
  async getFileStat(@Param('cid') cid: string) {
    try {
      return await this.ipfs.stat(cid);
    } catch {
      const data = await this.ipfs.cat(cid);
      const size = Buffer.from(data.dataBase64, 'base64').length;
      return { Key: cid, Size: size } as any;
    }
  }
}
