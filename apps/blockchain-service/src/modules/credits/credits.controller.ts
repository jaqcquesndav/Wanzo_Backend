import { Body, Controller, Post, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScopesGuard } from '../../auth/scopes.guard';
import { Scopes } from '../../auth/scopes.decorator';

@ApiTags('credits')
@Controller('credits')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class CreditsController {
  // Intent: credit request workflow (draft -> submit -> analyze -> approve/admin-approve or reject). Currently stubs.
  @Post()
  @ApiOperation({ summary: 'Create credit request (DRAFT)' })
  @Scopes('credits:write')
  create(@Body() _dto: any) {
    throw new Error('Not implemented');
  }
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit credit request (PENDING)' })
  @Scopes('credits:write')
  submit(@Param('id') _id: string) { throw new Error('Not implemented'); }
  @Post(':id/analyze')
  @ApiOperation({ summary: 'Analyze credit request' })
  @Scopes('credits:analyze')
  analyze(@Param('id') _id: string, @Body() _dto: any) { throw new Error('Not implemented'); }
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve by Manager' })
  @Scopes('credits:approve')
  approve(@Param('id') _id: string) { throw new Error('Not implemented'); }
  @Post(':id/admin-approve')
  @ApiOperation({ summary: 'Approve by Admin' })
  @Scopes('credits:admin')
  adminApprove(@Param('id') _id: string) { throw new Error('Not implemented'); }
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject credit request' })
  @Scopes('credits:approve')
  reject(@Param('id') _id: string) { throw new Error('Not implemented'); }
}
