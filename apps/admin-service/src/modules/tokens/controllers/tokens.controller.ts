import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokensService } from '../services';
import {
  TokenBalanceDto,
  TokenPackageDto,
  TokenPackagesResponseDto,
  CreateTokenPackageDto,
  UpdateTokenPackageDto,
  TokenPackageQueryDto,
  TokenTransactionDto,
  TransactionResponseDto,
  TokenTransactionQueryDto,
  TokenTransactionsResponseDto,
  PurchaseTokensDto,
  TokenConsumptionLogDto,
  CreateTokenConsumptionLogDto,
  TokenConsumptionQueryDto,
  TokenConsumptionLogsResponseDto,
  TokenAnalyticsDto,
  TokenAnalyticsQueryDto,
  UpdateTokenTransactionDto
} from '../dtos';
import { JwtBlacklistGuard } from '../../auth/guards/jwt-blacklist.guard'; // Added
import { RolesGuard } from '../../auth/guards/roles.guard'; // Added 
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'; // Added

@ApiTags('Tokens') // Added
@ApiBearerAuth() // Added
@UseGuards(JwtBlacklistGuard, RolesGuard) // Added
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  // Token Balance Endpoints
  @Get('balance')
  async getTokenBalance(
    @Query('userId') userId: string,
    @Query('customerAccountId') customerAccountId?: string
  ): Promise<TokenBalanceDto> {
    return this.tokensService.getTokenBalance(userId, customerAccountId);
  }

  // Token Package Endpoints
  @Get('packages')
  async getTokenPackages(
    @Query() queryDto: TokenPackageQueryDto
  ): Promise<TokenPackagesResponseDto> {
    return this.tokensService.getTokenPackages(queryDto);
  }

  @Get('packages/:id')
  async getTokenPackageById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<TokenPackageDto> {
    return this.tokensService.getTokenPackageById(id);
  }

  @Post('packages')
  async createTokenPackage(
    @Body() createDto: CreateTokenPackageDto
  ): Promise<TokenPackageDto> {
    return this.tokensService.createTokenPackage(createDto);
  }

  @Put('packages/:id')
  async updateTokenPackage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTokenPackageDto
  ): Promise<TokenPackageDto> {
    return this.tokensService.updateTokenPackage(id, updateDto);
  }

  @Delete('packages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTokenPackage(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this.tokensService.deleteTokenPackage(id);
  }

  // Token Transaction Endpoints
  @Get('transactions')
  async getTokenTransactions(
    @Query() queryDto: TokenTransactionQueryDto
  ): Promise<TokenTransactionsResponseDto> {
    return this.tokensService.getTokenTransactions(queryDto);
  }

  @Get('transactions/:id')
  async getTokenTransactionById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<TokenTransactionDto> {
    return this.tokensService.getTokenTransactionById(id);
  }

  @Put('transactions/:id')
  async updateTokenTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTokenTransactionDto
  ): Promise<TransactionResponseDto> {
    return this.tokensService.updateTokenTransaction(id, updateDto);
  }

  // Token Purchase Endpoint
  @Post('purchase')
  @UseInterceptors(FileInterceptor('proofDocument'))
  async purchaseTokens(
    @Body() purchaseDto: PurchaseTokensDto,
    @UploadedFile() file?: Express.Multer.File
  ): Promise<TransactionResponseDto> {
    // In a real implementation, file would be uploaded to a storage service
    // and the URL would be set in purchaseDto.proofDocumentUrl
    
    // For demonstration, simulate file upload
    if (file) {
      // Mock file upload result
      purchaseDto.proofDocumentUrl = `https://example.com/uploads/${file.originalname}`;
      purchaseDto.proofDocumentPublicId = `payment-proofs/${Date.now()}`;
    }
    
    return this.tokensService.purchaseTokens(purchaseDto);
  }

  // Token Consumption Endpoints
  @Post('consumption')
  async logTokenConsumption(
    @Body() createDto: CreateTokenConsumptionLogDto
  ): Promise<TokenConsumptionLogDto> {
    return this.tokensService.logTokenConsumption(createDto);
  }

  @Get('consumption')
  async getTokenConsumptionLogs(
    @Query() queryDto: TokenConsumptionQueryDto
  ): Promise<TokenConsumptionLogsResponseDto> {
    return this.tokensService.getTokenConsumptionLogs(queryDto);
  }

  // Token Analytics Endpoint
  @Get('analytics')
  async getTokenAnalytics(
    @Query() queryDto: TokenAnalyticsQueryDto
  ): Promise<TokenAnalyticsDto> {
    return this.tokensService.getTokenAnalytics(queryDto);
  }
}
