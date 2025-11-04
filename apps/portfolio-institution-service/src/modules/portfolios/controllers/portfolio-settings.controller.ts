import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('portfolio-settings')
@Controller('portfolios/traditional/:portfolioId/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PortfolioSettingsController {
  
  @Get()
  @ApiOperation({ summary: 'Get settings for a specific traditional portfolio' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio settings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPortfolioSettings(@Param('portfolioId') portfolioId: string, @Req() req: any) {
    // TODO: Implement service call
    return {
      success: true,
      data: {
        portfolioId,
        maxLoanAmount: 500000.00,
        interestRateRange: { min: 6.0, max: 18.0 },
        loanTermRange: { min: 6, max: 60 },
        riskToleranceLevel: 'medium',
        autoApprovalLimit: 100000.00,
        requiredDocuments: ['business_plan', 'financial_statements'],
        guaranteeRequirements: {
          personal: true,
          corporate: false,
          realEstate: true
        }
      }
    };
  }

  @Put()
  @Roles('admin', 'portfolio_manager')
  @ApiOperation({ summary: 'Update settings for a traditional portfolio' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio settings updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid settings data' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async updatePortfolioSettings(
    @Param('portfolioId') portfolioId: string,
    @Body() updateSettingsDto: any, // TODO: Create proper DTO
    @Req() req: any
  ) {
    // TODO: Implement service call
    return {
      success: true,
      data: {
        portfolioId,
        ...updateSettingsDto,
        updatedAt: new Date().toISOString()
      },
      message: 'Portfolio settings updated successfully'
    };
  }

  @Post('reset')
  @Roles('admin')
  @ApiOperation({ summary: 'Reset portfolio settings to default values' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio settings reset successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async resetPortfolioSettings(@Param('portfolioId') portfolioId: string, @Req() req: any) {
    // TODO: Implement service call
    const defaultSettings = {
      portfolioId,
      maxLoanAmount: 1000000.00,
      interestRateRange: { min: 8.0, max: 15.0 },
      loanTermRange: { min: 12, max: 48 },
      riskToleranceLevel: 'medium',
      autoApprovalLimit: 50000.00,
      requiredDocuments: ['business_plan', 'financial_statements', 'tax_returns'],
      guaranteeRequirements: {
        personal: true,
        corporate: false,
        realEstate: false
      }
    };

    return {
      success: true,
      data: defaultSettings,
      message: 'Portfolio settings reset to default values'
    };
  }
}