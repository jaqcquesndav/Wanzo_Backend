import { Controller, Post, Patch, UploadedFile, UseInterceptors, Param, Body, Req, HttpStatus, HttpCode, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { BaseCustomerService, MulterFile } from '../services/base-customer.service';
import { ApiResponseDto, MessageResponseDto, FileUploadResponseDto } from '../dto';

/**
 * DTOs communs pour les endpoints de validation/modération
 */
export class ValidateCustomerDto {
  validatedBy!: string;
}

export class SuspendCustomerDto {
  suspendedBy!: string;
  reason!: string;
}

export class RejectCustomerDto {
  rejectedBy!: string;
  reason!: string;
}

/**
 * Contrôleur de base abstrait pour les clients
 * Contient les endpoints communs partagés entre Company et FinancialInstitution controllers
 */
@Controller()
export abstract class BaseCustomerController<TResponseDto> {
  constructor(
    protected readonly customerService: BaseCustomerService<TResponseDto>
  ) {}

  /**
   * Endpoint commun pour valider un client
   */
  @Patch(':id/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valider un client' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client validé avec succès',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client non trouvé'
  })
  async validateCustomer(
    @Param('id') id: string,
    @Body() data: ValidateCustomerDto
  ): Promise<ApiResponseDto<MessageResponseDto>> {
    await this.customerService.validate(id, data.validatedBy);
    return {
      success: true,
      data: {
        message: 'Client validé avec succès'
      }
    };
  }

  /**
   * Endpoint commun pour suspendre un client
   */
  @Patch(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspendre un client' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client suspendu avec succès',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client non trouvé'
  })
  async suspendCustomer(
    @Param('id') id: string,
    @Body() data: SuspendCustomerDto
  ): Promise<ApiResponseDto<MessageResponseDto>> {
    await this.customerService.suspend(id, data.suspendedBy, data.reason);
    return {
      success: true,
      data: {
        message: 'Client suspendu avec succès'
      }
    };
  }

  /**
   * Endpoint commun pour rejeter un client
   */
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeter un client' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client rejeté avec succès',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client non trouvé'  
  })
  async rejectCustomer(
    @Param('id') id: string,
    @Body() data: RejectCustomerDto
  ): Promise<ApiResponseDto<MessageResponseDto>> {
    await this.customerService.reject(id, data.rejectedBy, data.reason);
    return {
      success: true,
      data: {
        message: 'Client rejeté avec succès'
      }
    };
  }

  /**
   * Endpoint commun pour réactiver un client
   */
  @Patch(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réactiver un client' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client réactivé avec succès',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client non trouvé'
  })
  async reactivateCustomer(
    @Param('id') id: string,
    @Body() data: { reactivatedBy: string }
  ): Promise<ApiResponseDto<MessageResponseDto>> {
    await this.customerService.reactivate(id, data.reactivatedBy);
    return {
      success: true,
      data: {
        message: 'Client réactivé avec succès'
      }
    };
  }

  /**
   * Méthode helper pour vérifier la propriété du client
   * Utilisée par les contrôleurs enfants pour la sécurité
   */
  protected async checkCustomerOwnership(customerId: string, auth0Id?: string): Promise<void> {
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const isOwner = await this.customerService.isCustomerOwner(customerId, auth0Id);
    if (!isOwner) {
      throw new UnauthorizedException('Vous n\'êtes pas autorisé à modifier ce client');
    }
  }

  /**
   * Méthode helper pour l'upload d'images
   * Peut être utilisée par les contrôleurs enfants
   */
  protected async handleImageUpload(
    customerId: string, 
    file: MulterFile, 
    folder: string = 'uploads'
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new NotFoundException('Aucun fichier fourni');
    }

    return this.customerService.uploadImage(customerId, file, folder);
  }

  /**
   * Méthode helper pour l'upload de documents
   * Peut être utilisée par les contrôleurs enfants
   */
  protected async handleDocumentUpload(
    customerId: string, 
    file: MulterFile, 
    folder: string = 'documents'
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new NotFoundException('Aucun fichier fourni');
    }

    return this.customerService.uploadDocument(customerId, file, folder);
  }
}