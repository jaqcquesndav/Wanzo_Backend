import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { CustomerDto, CustomerDocumentDto, CustomerActivityDto } from './customer-details.dto';

/**
 * DTO pour la réponse des détails d'un client
 */
export class CustomerDetailsResponseDto {
  @ApiProperty({ description: 'Customer data with documents and validation history' })
  customer: {
    id: string;
    name: string;
    type: 'pme' | 'financial';
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    status: string;
    billingContactName: string;
    billingContactEmail: string;
    tokenAllocation: number;
    accountType: string;
    ownerId: string;
    ownerEmail: string;
    validatedAt?: Date;
    validatedBy?: string;
    suspendedAt?: Date;
    suspendedBy?: string;
    suspensionReason?: string;
    reactivatedAt?: Date;
    reactivatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    documents?: CustomerDocumentDto[];
    validationHistory?: any[];
  };

  @ApiProperty({ description: 'Customer statistics' })
  statistics: {
    tokensUsed: number;
    lastActivity: Date;
    activeSubscriptions: number;
    totalSpent: number;
    documentsCount?: number;
    activitiesCount?: number;
  };

  @ApiProperty({ type: [CustomerActivityDto], description: 'Customer activities' })
  activities: CustomerActivityDto[];
}