import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScopesGuard } from '../../auth/scopes.guard';
import { Scopes } from '../../auth/scopes.decorator';

@ApiTags('repayments')
@Controller('repayments')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class RepaymentsController {
  // Intent: repayment lifecycle (create -> process/partial -> resolve disputes). Currently stubs.
  @Post()
  @ApiOperation({ summary: 'Create repayment' })
  @Scopes('repayments:write')
  create(@Body() _dto: any) { throw new Error('Not implemented'); }
  @Post(':id/process')
  @ApiOperation({ summary: 'Process repayment' })
  @Scopes('repayments:process')
  process(@Param('id') _id: string) { throw new Error('Not implemented'); }
  @Post(':id/partial')
  @ApiOperation({ summary: 'Partial repayment' })
  @Scopes('repayments:write')
  partial(@Param('id') _id: string, @Body() _dto: any) { throw new Error('Not implemented'); }
  @Post(':id/resolve-dispute')
  @ApiOperation({ summary: 'Resolve dispute' })
  @Scopes('repayments:resolve')
  resolve(@Param('id') _id: string, @Body() _dto: any) { throw new Error('Not implemented'); }
}
