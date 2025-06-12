import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { RequestAuditTokenDto, ValidateAuditTokenDto } from '../dtos/audit.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('request-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a token for an auditor' })  @ApiResponse({ status: 201, description: 'Token has been sent to the auditor' })
  async requestToken(@Body() requestDto: RequestAuditTokenDto, @Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const result = await this.auditService.requestToken(
      requestDto.name,
      requestDto.registrationNumber,
      req.user.companyId
    );
    
    return {
      success: true,
      message: 'Un token a été envoyé à l\'auditeur',
      data: {
        expiresAt: result.expiresAt.toISOString()
      }
    };
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validate an audit token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateToken(@Body() validateDto: ValidateAuditTokenDto): Promise<any> {
    const result = await this.auditService.validateToken(validateDto.token);
    
    if (!result.valid) {
      return {
        success: false,
        message: 'Token invalide ou expiré',
        data: {
          valid: false
        }
      };
    }
    
    // If the token is valid, we can set the audit status for the fiscal year
    // This would typically be done in a separate endpoint after validation
    
    return {
      success: true,
      message: 'Token validé avec succès',
      data: {
        valid: true,
        auditor: result.auditor
      }
    };
  }
}
