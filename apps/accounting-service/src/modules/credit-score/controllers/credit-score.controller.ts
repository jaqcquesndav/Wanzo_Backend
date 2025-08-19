import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreditScoreService } from '../services/credit-score.service';
import { CreditScoreMLService } from '../services/credit-score-ml.service';
import { CalculateCreditScoreDto, CreditScoreResponseDto } from '../dtos/credit-score.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('credit-score')
@Controller('credit-score')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CreditScoreController {
  constructor(
    private readonly creditScoreService: CreditScoreService,
    private readonly creditScoreMLService: CreditScoreMLService,
  ) {}

  @Post('predict')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Calculate credit score using ML model' })
  @ApiResponse({ 
    status: 201, 
    description: 'Credit score calculated successfully',
    type: CreditScoreResponseDto
  })
  async predictScore(@Body() calculateDto: CalculateCreditScoreDto): Promise<{
    success: boolean;
    score: CreditScoreResponseDto;
  }> {
    const score = await this.creditScoreMLService.predictCreditScore(calculateDto);
    return {
      success: true,
      score,
    };
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Calculate credit score based on treasury transactions' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Credit score calculated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        score: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            components: {
              type: 'object',
              properties: {
                transactionVolume: { type: 'number' },
                cashFlow: { type: 'number' },
                paymentRegularity: { type: 'number' },
                accountBalance: { type: 'number' },
                businessActivity: { type: 'number' }
              }
            },
            metadata: {
              type: 'object',
              properties: {
                periodStart: { type: 'string', format: 'date-time' },
                periodEnd: { type: 'string', format: 'date-time' },
                calculatedAt: { type: 'string', format: 'date-time' },
                transactionCount: { type: 'number' },
                averageBalance: { type: 'number' },
                volatility: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  async calculateScore(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const score = await this.creditScoreService.calculateCreditScore({
      companyId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return {
      success: true,
      score,
    };
  }
}
