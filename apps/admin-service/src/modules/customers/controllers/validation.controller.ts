import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';
import { ValidationService } from '../services/validation.service';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { User } from '@/modules/users/entities/user.entity';

@ApiTags('Customer Validation')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard)
@Controller('customers/:customerId/validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get()
  @ApiOperation({ summary: 'Get customer validation process' })
  @ApiResponse({ status: 200, description: 'Returns the current validation process for a customer' })
  async getValidationProcess(@Param('customerId') customerId: string) {
    return this.validationService.getValidationProcess(customerId);
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate customer validation process' })
  @ApiResponse({ status: 201, description: 'Validation process initiated successfully' })
  async initiateValidationProcess(
    @Param('customerId') customerId: string,
    @CurrentUser() user: User
  ) {
    return this.validationService.initiateValidationProcess(customerId, user);
  }

  @Put('steps/:stepId')
  @ApiOperation({ summary: 'Update validation step status' })
  @ApiResponse({ status: 200, description: 'Validation step updated successfully' })
  async updateValidationStep(
    @Param('customerId') customerId: string,
    @Param('stepId') stepId: string,
    @Body() updateData: any,
    @CurrentUser() user: User
  ) {
    return this.validationService.updateValidationStep(customerId, stepId, updateData, user);
  }

  @Get('extended')
  @ApiOperation({ summary: 'Get extended customer information' })
  @ApiResponse({ status: 200, description: 'Returns extended customer information' })
  async getExtendedCustomerInfo(@Param('customerId') customerId: string) {
    return this.validationService.getExtendedCustomerInfo(customerId);
  }
}
