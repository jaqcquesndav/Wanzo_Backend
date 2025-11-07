import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScopesGuard } from '../../auth/scopes.guard';
import { Scopes } from '../../auth/scopes.decorator';

@ApiTags('disbursements')
@Controller('disbursements')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class DisbursementsController {
  // Intent: disbursement workflow (create -> approvals -> client confirm -> execute/cancel). Currently stubs.
  @Post()
  @ApiOperation({ summary: 'Create disbursement' })
  @Scopes('disbursements:write')
  create(@Body() _dto: any) { throw new Error('Not implemented'); }
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve by Manager' })
  @Scopes('disbursements:approve')
  approve(@Param('id') _id: string) { throw new Error('Not implemented'); }
  @Post(':id/admin-approve')
  @ApiOperation({ summary: 'Approve by Admin' })
  @Scopes('disbursements:admin')
  adminApprove(@Param('id') _id: string) { throw new Error('Not implemented'); }
  @Post(':id/confirm-client')
  @ApiOperation({ summary: 'Client confirmation' })
  @Scopes('disbursements:confirm')
  confirm(@Param('id') _id: string) { throw new Error('Not implemented'); }
  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute disbursement' })
  @Scopes('disbursements:execute')
  execute(@Param('id') _id: string) { throw new Error('Not implemented'); }
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel disbursement' })
  @Scopes('disbursements:write')
  cancel(@Param('id') _id: string) { throw new Error('Not implemented'); }
}
