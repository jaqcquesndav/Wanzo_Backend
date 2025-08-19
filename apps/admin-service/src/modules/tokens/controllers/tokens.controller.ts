import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TokensService } from '../services/tokens.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
    TokenBalanceDto, 
    TokenPackagesResponseDto, 
    PurchaseTokensDto, 
    PurchaseTokensResponseDto, 
    TokenUsageResponseDto, 
    GetTokenUsageQueryDto, 
    TokenHistoryResponseDto, 
    GetTokenHistoryQueryDto, 
    TokenStatisticsDto, 
    GetTokenStatsQueryDto, 
    AllocateTokensDto, 
    AllocateTokensResponseDto 
} from '../dtos/token.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('Tokens')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tokens')
export class TokensController {
    constructor(private readonly tokensService: TokensService) {}

    private validateCustomerAccountId(user: User): string {
        if (!user.customerAccountId) {
            throw new UnauthorizedException('Customer account ID is required');
        }
        return user.customerAccountId;
    }

    @Get('balance')
    @ApiOperation({ summary: 'Get token balance', description: 'Retrieves the current token balance for the authenticated user or company.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: TokenBalanceDto })
    @Roles('tokens:read')
    getTokenBalance(@CurrentUser() user: User): Promise<TokenBalanceDto> {
        const customerAccountId = this.validateCustomerAccountId(user);
        return this.tokensService.getTokenBalance(customerAccountId);
    }

    @Get('packages')
    @ApiOperation({ summary: 'Get available token packages', description: 'Retrieves a list of available token packages for purchase.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: TokenPackagesResponseDto })
    @Roles('tokens:read')
    getAvailableTokenPackages(): Promise<TokenPackagesResponseDto> {
        return this.tokensService.getAvailableTokenPackages();
    }

    @Post('purchase')
    @UseInterceptors(FileInterceptor('proofDocument'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Purchase tokens', description: 'Initiates a token purchase.' })
    @ApiResponse({ status: 201, description: 'Token purchase successful', type: PurchaseTokensResponseDto })
    @Roles('tokens:purchase')
    purchaseTokens(
        @CurrentUser() user: User,
        @Body() purchaseTokensDto: PurchaseTokensDto,
        @UploadedFile() proofDocument: Express.Multer.File
    ): Promise<PurchaseTokensResponseDto> {
        const customerAccountId = this.validateCustomerAccountId(user);
        return this.tokensService.purchaseTokens(customerAccountId, purchaseTokensDto, proofDocument);
    }

    @Get('usage')
    @ApiOperation({ summary: 'Get token usage history', description: 'Retrieves the token usage history for the authenticated user or company.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: TokenUsageResponseDto })
    @Roles('tokens:read')
    getTokenUsageHistory(@CurrentUser() user: User, @Query() query: GetTokenUsageQueryDto): Promise<TokenUsageResponseDto> {
        const customerAccountId = this.validateCustomerAccountId(user);
        return this.tokensService.getTokenUsageHistory(customerAccountId, query);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get token transaction history', description: 'Retrieves the token transaction history for the authenticated user or company.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: TokenHistoryResponseDto })
    @Roles('tokens:read')
    getTokenTransactionHistory(@CurrentUser() user: User, @Query() query: GetTokenHistoryQueryDto): Promise<TokenHistoryResponseDto> {
        const customerAccountId = this.validateCustomerAccountId(user);
        return this.tokensService.getTokenTransactionHistory(customerAccountId, query);
    }

    @Get('usage/stats')
    @ApiOperation({ summary: 'Get token usage statistics by period', description: 'Retrieves token usage statistics for different time periods.' })
    @ApiResponse({ status: 200, description: 'Successful response' })
    @Roles('tokens:read')
    getTokenUsageStats(@CurrentUser() user: User, @Query() query: GetTokenStatsQueryDto): Promise<any> {
        const customerAccountId = this.validateCustomerAccountId(user);
        const period = query.period || 'monthly';
        return this.tokensService.getTokenUsageStats(customerAccountId, period);
    }

    @Get('usage/features')
    @ApiOperation({ summary: 'Get token usage statistics by feature', description: 'Retrieves token usage statistics grouped by feature.' })
    @ApiResponse({ status: 200, description: 'Successful response' })
    @Roles('tokens:read')
    getTokenUsageByFeature(@CurrentUser() user: User): Promise<any> {
        const customerAccountId = this.validateCustomerAccountId(user);
        return this.tokensService.getTokenUsageByFeature(customerAccountId);
    }

    @Get('usage/apps')
    @ApiOperation({ summary: 'Get token usage statistics by app', description: 'Retrieves token usage statistics grouped by application.' })
    @ApiResponse({ status: 200, description: 'Successful response' })
    @Roles('tokens:read')
    getTokenUsageByApp(@CurrentUser() user: User): Promise<any> {
        const customerAccountId = this.validateCustomerAccountId(user);
        return this.tokensService.getTokenUsageByApp(customerAccountId);
    }

    // Admin Endpoints
    @Get('/admin/tokens/statistics')
    @ApiOperation({ summary: 'Get all token statistics (Admin Only)', description: 'Retrieves comprehensive token statistics for admin dashboard.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: TokenStatisticsDto })
    @Roles('admin:tokens:read')
    getAllTokenStatistics(@Query() query: GetTokenStatsQueryDto): Promise<TokenStatisticsDto> {
        const period = query.period || 'monthly';
        return this.tokensService.getAllTokenStatistics(period);
    }

    @Post('/admin/tokens/allocate')
    @ApiOperation({ summary: 'Allocate tokens to customer (Admin Only)', description: 'Allocates tokens to a specific customer.' })
    @ApiResponse({ status: 200, description: 'Tokens allocated successfully', type: AllocateTokensResponseDto })
    @Roles('admin:tokens:write')
    allocateTokens(
        @CurrentUser() user: User,
        @Body() allocateTokensDto: AllocateTokensDto
    ): Promise<AllocateTokensResponseDto> {
        return this.tokensService.allocateTokens(user.id, allocateTokensDto);
    }
}
