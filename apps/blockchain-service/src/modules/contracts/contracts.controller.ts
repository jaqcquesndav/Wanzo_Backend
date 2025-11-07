import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScopesGuard } from '../../auth/scopes.guard';
import { Scopes } from '../../auth/scopes.decorator';

@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  // Intent: manage contract modification workflow and documents lifecycle tied to Fabric anchoring.
  // All methods are stubs pending business implementation.
  @Get('health')
  health() { return { status: 'ok' }; }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/modify')
  @ApiOperation({ summary: 'Propose contract modification' })
  @Scopes('contracts:write')
  modify(@Param('id') _id: string, @Body() _dto: any) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/approve-manager')
  @ApiOperation({ summary: 'Manager approval' })
  @Scopes('contracts:approve')
  approveManager(@Param('id') _id: string) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/approve-admin')
  @ApiOperation({ summary: 'Admin approval' })
  @Scopes('contracts:admin')
  approveAdmin(@Param('id') _id: string) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/approve-client')
  @ApiOperation({ summary: 'Client approval' })
  @Scopes('contracts:client')
  approveClient(@Param('id') _id: string) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject contract modification' })
  @Scopes('contracts:approve')
  reject(@Param('id') _id: string) { throw new Error('Not implemented'); }

  // Documents
  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload a contract document (PDF → IPFS)' })
  @Scopes('contracts:documents')
  uploadDoc(@Param('id') _id: string, @Body() _dto: any) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/documents/generate')
  @ApiOperation({ summary: 'Generate a contract PDF' })
  @Scopes('contracts:documents')
  generateDoc(@Param('id') _id: string, @Body() _dto: any) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Get(':id/documents')
  @ApiOperation({ summary: 'List documents' })
  @Scopes('contracts:documents')
  listDocs(@Param('id') _id: string) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Get(':id/documents/:docId/download')
  @ApiOperation({ summary: 'Download a signed document' })
  @Scopes('contracts:documents')
  downloadDoc(@Param('id') _id: string, @Param('docId') _docId: string) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/documents/:docId/signature-requests')
  @ApiOperation({ summary: 'Create signature request' })
  @Scopes('contracts:documents')
  signatureRequest(@Param('id') _id: string, @Param('docId') _docId: string) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/documents/:docId/sign')
  @ApiOperation({ summary: 'Sign a document' })
  @Scopes('contracts:documents')
  sign(@Param('id') _id: string, @Param('docId') _docId: string, @Body() _dto: any) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/documents/:docId/finalize')
  @ApiOperation({ summary: 'Finalize a document version' })
  @Scopes('contracts:documents')
  finalize(@Param('id') _id: string, @Param('docId') _docId: string) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/documents/:docId/anchor')
  @ApiOperation({ summary: 'Anchor document hash on Fabric' })
  @Scopes('contracts:documents')
  anchor(@Param('id') _id: string, @Param('docId') _docId: string) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/documents/:docId/hash/verify')
  @ApiOperation({ summary: 'Verify document hash' })
  @Scopes('contracts:documents')
  verifyHash(@Param('id') _id: string, @Param('docId') _docId: string, @Body() _dto: any) { throw new Error('Not implemented'); }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post(':id/documents/verify-by-upload')
  @ApiOperation({ summary: 'Verify by PDF upload' })
  @Scopes('contracts:documents')
  verifyByUpload(@Param('id') _id: string, @Body() _dto: any) { throw new Error('Not implemented'); }
}
