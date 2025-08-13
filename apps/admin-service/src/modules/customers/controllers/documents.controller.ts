import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';
import { CustomersService } from '../services';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { User } from '@/modules/users/entities/user.entity';
import { ApproveDocumentDto, RejectDocumentDto } from '../dtos';

@ApiTags('Customer Documents')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard)
@Controller('customers/:customerId/documents')
export class DocumentsController {
  constructor(private readonly customersService: CustomersService) {}

  @Post(':documentId/validate')
  @ApiOperation({ summary: 'Validate a customer document' })
  @ApiResponse({ status: 200, description: 'Document validated successfully' })
  async validateDocument(
    @Param('customerId') customerId: string,
    @Param('documentId') documentId: string,
    @Body() approveDto: ApproveDocumentDto,
    @CurrentUser() user: User
  ) {
    return this.customersService.approveDocument(customerId, documentId, approveDto, user);
  }

  @Post(':documentId/reject')
  @ApiOperation({ summary: 'Reject a customer document' })
  @ApiResponse({ status: 200, description: 'Document rejected successfully' })
  async rejectDocument(
    @Param('customerId') customerId: string,
    @Param('documentId') documentId: string,
    @Body() rejectDto: RejectDocumentDto,
    @CurrentUser() user: User
  ) {
    return this.customersService.rejectDocument(customerId, documentId, rejectDto, user);
  }
}
