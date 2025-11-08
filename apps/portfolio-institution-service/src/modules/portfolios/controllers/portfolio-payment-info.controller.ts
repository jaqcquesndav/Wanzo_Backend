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
import { PortfolioPaymentInfoService } from '../services/portfolio-payment-info.service';
import {
  UpdatePortfolioPaymentInfoDto,
  AddPortfolioBankAccountDto,
  AddPortfolioMobileMoneyAccountDto,
  VerifyPortfolioMobileMoneyAccountDto,
  PortfolioPaymentInfoResponseDto
} from '../dtos/portfolio-payment-info.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Portfolio Payment Info')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolios/:portfolioId/payment-info')
export class PortfolioPaymentInfoController {
  constructor(
    private readonly portfolioPaymentInfoService: PortfolioPaymentInfoService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get portfolio manager payment information',
    description: 'Retrieve all payment information for a portfolio manager including bank accounts, mobile money accounts, and payment preferences'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment information retrieved successfully',
    type: PortfolioPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found'
  })
  async getPortfolioPaymentInfo(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string
  ): Promise<PortfolioPaymentInfoResponseDto> {
    return this.portfolioPaymentInfoService.getPortfolioPaymentInfo(portfolioId);
  }

  @Put()
  @ApiOperation({
    summary: 'Update portfolio manager payment information',
    description: 'Update payment information for a portfolio manager including bank accounts, mobile money accounts, and payment preferences'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdatePortfolioPaymentInfoDto,
    description: 'Payment information to update'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment information updated successfully',
    type: PortfolioPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment information'
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found'
  })
  async updatePortfolioPaymentInfo(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Body() updateDto: UpdatePortfolioPaymentInfoDto
  ): Promise<PortfolioPaymentInfoResponseDto> {
    return this.portfolioPaymentInfoService.updatePortfolioPaymentInfo(portfolioId, updateDto);
  }

  @Post('bank-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add bank account to portfolio manager',
    description: 'Add a new bank account to the portfolio manager payment information'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: AddPortfolioBankAccountDto,
    description: 'Bank account information to add'
  })
  @ApiResponse({
    status: 201,
    description: 'Bank account added successfully',
    type: PortfolioPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bank account information or account holder name mismatch'
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Bank account already exists'
  })
  async addBankAccount(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Body() addBankAccountDto: Omit<AddPortfolioBankAccountDto, 'portfolioId'>
  ): Promise<PortfolioPaymentInfoResponseDto> {
    return this.portfolioPaymentInfoService.addBankAccount({
      ...addBankAccountDto,
      portfolioId
    });
  }

  @Post('mobile-money-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add mobile money account to portfolio manager',
    description: 'Add a new mobile money account to the portfolio manager payment information'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: AddPortfolioMobileMoneyAccountDto,
    description: 'Mobile money account information to add'
  })
  @ApiResponse({
    status: 201,
    description: 'Mobile money account added successfully',
    type: PortfolioPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid mobile money account information or account holder name mismatch'
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Mobile money account already exists'
  })
  async addMobileMoneyAccount(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Body() addMobileMoneyDto: Omit<AddPortfolioMobileMoneyAccountDto, 'portfolioId'>
  ): Promise<PortfolioPaymentInfoResponseDto> {
    return this.portfolioPaymentInfoService.addMobileMoneyAccount({
      ...addMobileMoneyDto,
      portfolioId
    });
  }

  @Post('mobile-money-accounts/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify portfolio manager mobile money account',
    description: 'Verify a portfolio manager mobile money account using SMS verification code'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: VerifyPortfolioMobileMoneyAccountDto,
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
    description: 'Portfolio or mobile money account not found'
  })
  async verifyMobileMoneyAccount(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Body() verifyDto: Omit<VerifyPortfolioMobileMoneyAccountDto, 'portfolioId'>
  ): Promise<{ success: boolean; message: string }> {
    return this.portfolioPaymentInfoService.verifyMobileMoneyAccount({
      ...verifyDto,
      portfolioId
    });
  }

  @Delete('bank-accounts/:accountNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove bank account from portfolio manager',
    description: 'Remove a bank account from the portfolio manager payment information'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
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
    type: PortfolioPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or bank account not found'
  })
  async removeBankAccount(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('accountNumber') accountNumber: string
  ): Promise<PortfolioPaymentInfoResponseDto> {
    return this.portfolioPaymentInfoService.removeBankAccount(portfolioId, accountNumber);
  }

  @Delete('mobile-money-accounts/:phoneNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove mobile money account from portfolio manager',
    description: 'Remove a mobile money account from the portfolio manager payment information'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
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
    type: PortfolioPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or mobile money account not found'
  })
  async removeMobileMoneyAccount(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('phoneNumber') phoneNumber: string
  ): Promise<PortfolioPaymentInfoResponseDto> {
    return this.portfolioPaymentInfoService.removeMobileMoneyAccount(portfolioId, phoneNumber);
  }

  @Put('bank-accounts/:accountNumber/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set default bank account for portfolio manager',
    description: 'Set a bank account as the default payment account for the portfolio manager'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
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
    type: PortfolioPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or bank account not found'
  })
  async setDefaultBankAccount(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('accountNumber') accountNumber: string
  ): Promise<PortfolioPaymentInfoResponseDto> {
    return this.portfolioPaymentInfoService.setDefaultBankAccount(portfolioId, accountNumber);
  }

  @Put('mobile-money-accounts/:phoneNumber/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set default mobile money account for portfolio manager',
    description: 'Set a mobile money account as the default payment account for the portfolio manager'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
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
    type: PortfolioPaymentInfoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or mobile money account not found'
  })
  async setDefaultMobileMoneyAccount(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('phoneNumber') phoneNumber: string
  ): Promise<PortfolioPaymentInfoResponseDto> {
    return this.portfolioPaymentInfoService.setDefaultMobileMoneyAccount(portfolioId, phoneNumber);
  }

  @Get('accounts')
  @ApiOperation({
    summary: 'Get payment accounts for processing',
    description: 'Get all verified payment accounts for the portfolio manager for payment processing'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment accounts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        bankAccounts: { type: 'array' },
        mobileMoneyAccounts: { type: 'array' },
        defaultAccount: { type: 'object' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found'
  })
  async getPaymentAccounts(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string
  ): Promise<{
    bankAccounts: any[];
    mobileMoneyAccounts: any[];
    defaultAccount: any | null;
  }> {
    return this.portfolioPaymentInfoService.getPaymentAccounts(portfolioId);
  }
}