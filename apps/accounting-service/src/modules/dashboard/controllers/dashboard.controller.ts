import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DashboardFilterDto } from '../dtos/dashboard.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles('admin', 'accountant')
  @ApiOperation({ 
    summary: 'Get dashboard data',
    description: 'Retrieve financial dashboard data including KPIs and analytics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            financialPosition: {
              type: 'object',
              properties: {
                balanceSheet: {
                  type: 'object',
                  properties: {
                    totalAssets: { type: 'number' },
                    totalLiabilities: { type: 'number' },
                    totalEquity: { type: 'number' },
                    netAssets: { type: 'number' },
                  },
                },
                ratios: {
                  type: 'object',
                  properties: {
                    currentRatio: { type: 'number' },
                    debtEquityRatio: { type: 'number' },
                    workingCapital: { type: 'number' },
                  },
                },
              },
            },
            profitAndLoss: {
              type: 'object',
              properties: {
                current: {
                  type: 'object',
                  properties: {
                    revenue: { type: 'number' },
                    expenses: { type: 'number' },
                    grossProfit: { type: 'number' },
                    netProfit: { type: 'number' },
                    profitMargin: { type: 'number' },
                  },
                },
                comparison: {
                  type: 'object',
                  properties: {
                    revenue: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        change: { type: 'number' },
                      },
                    },
                    expenses: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        change: { type: 'number' },
                      },
                    },
                    grossProfit: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        change: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
            cashPosition: {
              type: 'object',
              properties: {
                accounts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      account: { type: 'string' },
                      balance: { type: 'number' },
                      pendingReceipts: { type: 'number' },
                      pendingPayments: { type: 'number' },
                      availableBalance: { type: 'number' },
                    },
                  },
                },
                totals: {
                  type: 'object',
                  properties: {
                    balance: { type: 'number' },
                    pendingReceipts: { type: 'number' },
                    pendingPayments: { type: 'number' },
                    availableBalance: { type: 'number' },
                  },
                },
              },
            },
            taxSummary: {
              type: 'object',
              properties: {
                totalDue: { type: 'number' },
                totalPaid: { type: 'number' },
                upcomingPayments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      amount: { type: 'number' },
                      dueDate: { type: 'string', format: 'date-time' },
                      status: { type: 'string' },
                    },
                  },
                },
                overduePayments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      amount: { type: 'number' },
                      dueDate: { type: 'string', format: 'date-time' },
                      status: { type: 'string' },
                      daysOverdue: { type: 'number' },
                    },
                  },
                },
              },
            },
            topAccounts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  account: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                    },
                  },
                  movements: {
                    type: 'object',
                    properties: {
                      debit: { type: 'number' },
                      credit: { type: 'number' },
                      balance: { type: 'number' },
                    },
                  },
                },
              },
            },
            recentTransactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date-time' },
                  reference: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string' },
                  amount: { type: 'number' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getDashboardData(@Query() filters: DashboardFilterDto) {
    const data = await this.dashboardService.getDashboardData(filters);
    return {
      success: true,
      data,
    };
  }
}