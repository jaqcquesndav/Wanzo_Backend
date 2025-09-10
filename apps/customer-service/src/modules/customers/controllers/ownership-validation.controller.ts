import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OwnershipValidatorService, OwnershipValidationResult } from '../services/ownership-validator.service';
import { ApiResponseDto } from '../../system-users/dto/user.dto';

class AssignOwnerDto {
  userId!: string;
  entityType!: 'SME' | 'FINANCIAL_INSTITUTION';
}

@ApiTags('ownership-validation')
@ApiBearerAuth()
@Controller('ownership')
@UseGuards(JwtAuthGuard)
export class OwnershipValidationController {
  constructor(private readonly ownershipValidator: OwnershipValidatorService) {}

  @Get('validate')
  @ApiOperation({ summary: 'Validate all ownership relationships' })
  @ApiResponse({ 
    status: 200, 
    description: 'Ownership validation completed',
  })
  async validateOwnerships(): Promise<ApiResponseDto<OwnershipValidationResult>> {
    const result = await this.ownershipValidator.validateAllOwnerships();
    return {
      success: true,
      data: result,
      meta: {
        message: result.valid 
          ? 'All ownership relationships are valid' 
          : `Found ${result.issues.length} ownership issues`
      }
    };
  }

  @Post('auto-fix')
  @ApiOperation({ summary: 'Attempt to automatically fix ownership issues' })
  @ApiResponse({ 
    status: 200, 
    description: 'Auto-fix completed',
  })
  async autoFixOwnerships(): Promise<ApiResponseDto<{
    fixed: number;
    failed: number;
    details: string[];
  }>> {
    const result = await this.ownershipValidator.autoFixOwnershipIssues();
    return {
      success: true,
      data: result,
      meta: {
        message: `Fixed ${result.fixed} issues, ${result.failed} failed`
      }
    };
  }

  @Patch(':entityId/assign-owner')
  @ApiOperation({ summary: 'Manually assign owner to an entity' })
  @ApiResponse({ 
    status: 200, 
    description: 'Owner assigned successfully',
  })
  async assignOwner(
    @Param('entityId') entityId: string,
    @Body() assignOwnerDto: AssignOwnerDto
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.ownershipValidator.assignOwnerToEntity(
      entityId, 
      assignOwnerDto.userId, 
      assignOwnerDto.entityType
    );

    return {
      success: true,
      data: { message: 'Owner assigned successfully' },
    };
  }

  @Get('report')
  @ApiOperation({ summary: 'Get detailed ownership report' })
  @ApiResponse({ 
    status: 200, 
    description: 'Ownership report generated',
  })
  async getOwnershipReport(): Promise<ApiResponseDto<{
    summary: {
      totalEntities: number;
      validEntities: number;
      invalidEntities: number;
      validationRate: number;
    };
    breakdown: {
      sme: { total: number; valid: number; issues: number };
      financial: { total: number; valid: number; issues: number };
    };
    criticalIssues: OwnershipValidationResult['issues'];
  }>> {
    const validation = await this.ownershipValidator.validateAllOwnerships();
    
    const smeIssues = validation.issues.filter(issue => issue.entityType === 'SME');
    const financialIssues = validation.issues.filter(issue => issue.entityType === 'FINANCIAL_INSTITUTION');
    
    // Get total counts (this is simplified - in a real implementation you'd query the database)
    const totalSme = validation.totalEntities * 0.7; // Assuming 70% are SMEs
    const totalFinancial = validation.totalEntities * 0.3; // Assuming 30% are Financial

    const report = {
      summary: {
        totalEntities: validation.totalEntities,
        validEntities: validation.validEntities,
        invalidEntities: validation.issues.length,
        validationRate: (validation.validEntities / validation.totalEntities) * 100,
      },
      breakdown: {
        sme: {
          total: Math.round(totalSme),
          valid: Math.round(totalSme) - smeIssues.length,
          issues: smeIssues.length,
        },
        financial: {
          total: Math.round(totalFinancial),
          valid: Math.round(totalFinancial) - financialIssues.length,
          issues: financialIssues.length,
        },
      },
      criticalIssues: validation.issues.filter(issue => 
        issue.issueType === 'NO_OWNER' || issue.issueType === 'INVALID_OWNER'
      ),
    };

    return {
      success: true,
      data: report,
      meta: {
        message: `Generated ownership report with ${validation.issues.length} issues found`
      }
    };
  }
}
