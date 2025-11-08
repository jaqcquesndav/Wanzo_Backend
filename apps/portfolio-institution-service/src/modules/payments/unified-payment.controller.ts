import { 
  Controller, 
  Post, 
  Body, 
  Param,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiBody 
} from '@nestjs/swagger';
import { UnifiedPaymentService, UnifiedPaymentRequest } from './unified-payment.service';
import { RepaymentType } from '../portfolios/entities/repayment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// DTOs pour la documentation Swagger
export class BankInfoDto {
  debitAccount?: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode?: string;
  };
  beneficiaryAccount: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode?: string;
    swiftCode?: string;
  };
}

export class MobileMoneyInfoDto {
  phoneNumber: string;
  operator: 'AM' | 'OM' | 'WAVE' | 'MP' | 'AF';
  operatorName: string;
  accountName?: string;
}

export class ProcessUnifiedPaymentDto implements UnifiedPaymentRequest {
  type: 'disbursement' | 'repayment';
  contractId: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'mobile_money';
  scheduleIds?: string[];
  paymentType?: RepaymentType;
  reference?: string;
  description?: string;
  bankInfo?: BankInfoDto;
  mobileMoneyInfo?: MobileMoneyInfoDto;
}

@ApiTags('unified-payments')
@Controller('unified-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UnifiedPaymentController {
  constructor(
    private readonly unifiedPaymentService: UnifiedPaymentService,
  ) {}

  @Post('process')
  @Roles('admin', 'manager', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Traiter un paiement unifié (déboursement ou remboursement)',
    description: 'Traite un paiement via virement bancaire ou mobile money pour les financements d\'entreprise'
  })
  @ApiBody({ type: ProcessUnifiedPaymentDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Paiement traité avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['disbursement', 'repayment'] },
            disbursement: { type: 'object' },
            repayment: { type: 'object' },
            contract: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                contractNumber: { type: 'string' },
                status: { type: 'string' }
              }
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données de paiement invalides' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contrat non trouvé' 
  })
  async processUnifiedPayment(
    @Body() processPaymentDto: ProcessUnifiedPaymentDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.unifiedPaymentService.processUnifiedPayment(
      processPaymentDto,
      user.id
    );

    return {
      success: true,
      data: result,
      message: `${processPaymentDto.type === 'disbursement' ? 'Déboursement' : 'Remboursement'} traité avec succès`
    };
  }

  @Post('disbursement/:contractId')
  @Roles('admin', 'manager', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Effectuer un déboursement pour un contrat',
    description: 'Débloque les fonds d\'un contrat approuvé vers l\'entreprise bénéficiaire'
  })
  @ApiParam({ name: 'contractId', description: 'ID du contrat' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Montant à débourser' },
        paymentMethod: { type: 'string', enum: ['bank_transfer', 'mobile_money'] },
        bankInfo: { 
          type: 'object',
          description: 'Informations bancaires (requis si paymentMethod = bank_transfer)'
        },
        mobileMoneyInfo: { 
          type: 'object',
          description: 'Informations mobile money (requis si paymentMethod = mobile_money)'
        },
        description: { type: 'string', description: 'Description du déboursement' }
      },
      required: ['amount', 'paymentMethod']
    }
  })
  async processDisbursement(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() body: {
      amount: number;
      paymentMethod: 'bank_transfer' | 'mobile_money';
      bankInfo?: BankInfoDto;
      mobileMoneyInfo?: MobileMoneyInfoDto;
      description?: string;
    },
    @CurrentUser() user: any,
  ) {
    const request: UnifiedPaymentRequest = {
      type: 'disbursement',
      contractId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      bankInfo: body.bankInfo,
      mobileMoneyInfo: body.mobileMoneyInfo,
      description: body.description
    };

    const result = await this.unifiedPaymentService.processUnifiedPayment(request, user.id);

    return {
      success: true,
      data: result,
      message: 'Déboursement effectué avec succès'
    };
  }

  @Post('repayment/:contractId')
  @Roles('admin', 'manager', 'portfolio_manager', 'client')
  @ApiOperation({ 
    summary: 'Effectuer un remboursement pour un contrat',
    description: 'Traite un remboursement d\'échéance ou anticipé pour un contrat'
  })
  @ApiParam({ name: 'contractId', description: 'ID du contrat' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Montant à rembourser' },
        paymentMethod: { type: 'string', enum: ['bank_transfer', 'mobile_money'] },
        paymentType: { 
          type: 'string', 
          enum: ['standard', 'partial', 'advance', 'early_payoff'],
          default: 'standard'
        },
        scheduleIds: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'IDs des échéances à payer (optionnel)'
        },
        bankInfo: { 
          type: 'object',
          description: 'Informations bancaires (requis si paymentMethod = bank_transfer)'
        },
        mobileMoneyInfo: { 
          type: 'object',
          description: 'Informations mobile money (requis si paymentMethod = mobile_money)'
        },
        reference: { type: 'string', description: 'Référence du paiement' }
      },
      required: ['amount', 'paymentMethod']
    }
  })
  async processRepayment(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() body: {
      amount: number;
      paymentMethod: 'bank_transfer' | 'mobile_money';
      paymentType?: 'standard' | 'partial' | 'advance' | 'early_payoff';
      scheduleIds?: string[];
      bankInfo?: BankInfoDto;
      mobileMoneyInfo?: MobileMoneyInfoDto;
      reference?: string;
    },
    @CurrentUser() user: any,
  ) {
    const request: UnifiedPaymentRequest = {
      type: 'repayment',
      contractId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      paymentType: (body.paymentType as any) || 'standard',
      scheduleIds: body.scheduleIds,
      bankInfo: body.bankInfo,
      mobileMoneyInfo: body.mobileMoneyInfo,
      reference: body.reference
    };

    const result = await this.unifiedPaymentService.processUnifiedPayment(request, user.id);

    return {
      success: true,
      data: result,
      message: 'Remboursement effectué avec succès'
    };
  }

  @Get('contract/:contractId/payment-info')
  @Roles('admin', 'manager', 'portfolio_manager', 'client')
  @ApiOperation({ 
    summary: 'Obtenir les informations de paiement d\'un contrat',
    description: 'Récupère les comptes bancaires et mobile money disponibles pour un contrat'
  })
  @ApiParam({ name: 'contractId', description: 'ID du contrat' })
  async getContractPaymentInfo(
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ) {
    // Cette méthode devrait récupérer les informations de paiement depuis gestion-commerciale
    // Pour l'instant, retourne une structure exemple
    return {
      success: true,
      data: {
        contractId,
        clientPaymentInfo: {
          bankAccounts: [],
          mobileMoneyAccounts: []
        },
        portfolioPaymentInfo: {
          bankAccounts: [],
          mobileMoneyAccounts: []
        }
      },
      message: 'Informations de paiement récupérées avec succès'
    };
  }

  @Post('callback/serdipay/:type')
  @ApiOperation({ 
    summary: 'Callback SerdiPay pour les paiements de financement',
    description: 'Endpoint de callback pour recevoir les notifications de paiement SerdiPay'
  })
  @ApiParam({ name: 'type', enum: ['disbursement', 'repayment'] })
  async serdiPayCallback(
    @Param('type') type: 'disbursement' | 'repayment',
    @Body() callbackData: any,
  ) {
    // Traiter la notification de callback SerdiPay
    return {
      success: true,
      message: 'Callback processed successfully'
    };
  }
}