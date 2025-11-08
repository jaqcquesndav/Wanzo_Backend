import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { CompanyPaymentInfoService } from '../services/company-payment-info.service';
import {
  UpdateCompanyPaymentInfoDto,
  AddBankAccountDto,
  AddMobileMoneyAccountDto,
  VerifyMobileMoneyAccountDto,
  CompanyPaymentInfoResponseDto
} from '../dto/company-payment-info.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Company Payment Info')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies/:companyId/payment-info')
export class CompanyPaymentInfoController {
  constructor(
    private readonly companyPaymentInfoService: CompanyPaymentInfoService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get company payment information',
    description: 'Retrieve all payment information for a company including bank accounts, mobile money accounts, and payment preferences'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment information retrieved successfully',
    type: CompanyPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  async getCompanyPaymentInfo(
    @Param('companyId', ParseUUIDPipe) companyId: string
  ): Promise<CompanyPaymentInfoResponseDto> {
    return this.companyPaymentInfoService.getCompanyPaymentInfo(companyId);
  }

  @Put()
  @ApiOperation({
    summary: 'Update company payment information',
    description: 'Update payment information for a company including bank accounts, mobile money accounts, and payment preferences'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateCompanyPaymentInfoDto,
    description: 'Payment information to update'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment information updated successfully',
    type: CompanyPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment information'
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  async updateCompanyPaymentInfo(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() updateDto: UpdateCompanyPaymentInfoDto
  ): Promise<CompanyPaymentInfoResponseDto> {
    return this.companyPaymentInfoService.updateCompanyPaymentInfo(companyId, updateDto);
  }

  @Post('bank-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add bank account',
    description: 'Add a new bank account to the company payment information'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: AddBankAccountDto,
    description: 'Bank account information to add'
  })
  @ApiResponse({
    status: 201,
    description: 'Bank account added successfully',
    type: CompanyPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bank account information'
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Bank account already exists'
  })
  async addBankAccount(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() addBankAccountDto: Omit<AddBankAccountDto, 'companyId'>
  ): Promise<CompanyPaymentInfoResponseDto> {
    return this.companyPaymentInfoService.addBankAccount({
      ...addBankAccountDto,
      companyId
    });
  }

  @Post('mobile-money-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add mobile money account',
    description: 'Add a new mobile money account to the company payment information'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: AddMobileMoneyAccountDto,
    description: 'Mobile money account information to add'
  })
  @ApiResponse({
    status: 201,
    description: 'Mobile money account added successfully',
    type: CompanyPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid mobile money account information'
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Mobile money account already exists'
  })
  async addMobileMoneyAccount(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() addMobileMoneyDto: Omit<AddMobileMoneyAccountDto, 'companyId'>
  ): Promise<CompanyPaymentInfoResponseDto> {
    return this.companyPaymentInfoService.addMobileMoneyAccount({
      ...addMobileMoneyDto,
      companyId
    });
  }

  @Post('mobile-money-accounts/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify mobile money account',
    description: 'Verify a mobile money account using SMS verification code'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: VerifyMobileMoneyAccountDto,
    description: 'Verification information'
  })
  @ApiResponse({
    status: 200,
    description: 'Mobile money account verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code'
  })
  @ApiResponse({
    status: 404,
    description: 'Company or mobile money account not found'
  })
  async verifyMobileMoneyAccount(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() verifyDto: Omit<VerifyMobileMoneyAccountDto, 'companyId'>
  ): Promise<{ success: boolean; message: string }> {
    return this.companyPaymentInfoService.verifyMobileMoneyAccount({
      ...verifyDto,
      companyId
    });
  }

  @Delete('bank-accounts/:accountNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove bank account',
    description: 'Remove a bank account from the company payment information'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({
    name: 'accountNumber',
    description: 'Bank account number to remove',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Bank account removed successfully',
    type: CompanyPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Company or bank account not found'
  })
  async removeBankAccount(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('accountNumber') accountNumber: string
  ): Promise<CompanyPaymentInfoResponseDto> {
    return this.companyPaymentInfoService.removeBankAccount(companyId, accountNumber);
  }

  @Delete('mobile-money-accounts/:phoneNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove mobile money account',
    description: 'Remove a mobile money account from the company payment information'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Phone number of the mobile money account to remove',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Mobile money account removed successfully',
    type: CompanyPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Company or mobile money account not found'
  })
  async removeMobileMoneyAccount(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('phoneNumber') phoneNumber: string
  ): Promise<CompanyPaymentInfoResponseDto> {
    return this.companyPaymentInfoService.removeMobileMoneyAccount(companyId, phoneNumber);
  }

  @Put('bank-accounts/:accountNumber/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set default bank account',
    description: 'Set a bank account as the default payment account for the company'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({
    name: 'accountNumber',
    description: 'Bank account number to set as default',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Default bank account set successfully',
    type: CompanyPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Company or bank account not found'
  })
  async setDefaultBankAccount(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('accountNumber') accountNumber: string
  ): Promise<CompanyPaymentInfoResponseDto> {
    return this.companyPaymentInfoService.setDefaultBankAccount(companyId, accountNumber);
  }

  @Put('mobile-money-accounts/:phoneNumber/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set default mobile money account',
    description: 'Set a mobile money account as the default payment account for the company'
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Phone number of the mobile money account to set as default',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Default mobile money account set successfully',
    type: CompanyPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Company or mobile money account not found'
  })
  async setDefaultMobileMoneyAccount(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('phoneNumber') phoneNumber: string
  ): Promise<CompanyPaymentInfoResponseDto> {
    return this.companyPaymentInfoService.setDefaultMobileMoneyAccount(companyId, phoneNumber);
  }
}