import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Declaration } from '../entities/declaration.entity';
import { DeclarationAttachment } from '../entities/declaration-attachment.entity';
import { 
  CreateDeclarationDto, 
  UpdateDeclarationDto, 
  UpdateDeclarationStatusDto, 
  DeclarationFilterDto,
  DeclarationType,
  DeclarationStatus,
  Periodicity
} from '../dtos/declaration.dto';

@Injectable()
export class DeclarationService {
  constructor(
    @InjectRepository(Declaration)
    private declarationRepository: Repository<Declaration>,
    @InjectRepository(DeclarationAttachment)
    private attachmentRepository: Repository<DeclarationAttachment>,
  ) {}

  async create(createDto: CreateDeclarationDto, userId: string): Promise<Declaration> {
    // Déterminer la périodicité et la date d'échéance en fonction du type
    const { periodicity, dueDate } = this.calculateDueDateAndPeriodicity(createDto.type, createDto.period);
    
    // Générer une référence unique
    const reference = this.generateReference(createDto.type, createDto.period);
    
    // Créer la déclaration
    const declaration = this.declarationRepository.create({
      ...createDto,
      periodicity,
      dueDate,
      reference,
      status: DeclarationStatus.DRAFT,
      companyId: userId, // À remplacer par la logique d'extraction du companyId
    });
    
    return this.declarationRepository.save(declaration);
  }

  async findAll(filterDto: DeclarationFilterDto): Promise<{ data: Declaration[], total: number, page: number, pageSize: number, totalPages: number }> {
    const { type, category, status, period, page = 1, pageSize = 20 } = filterDto;
    const skip = (page - 1) * pageSize;
    
    const queryBuilder = this.declarationRepository.createQueryBuilder('declaration');
    
    // Appliquer les filtres
    if (type) {
      queryBuilder.andWhere('declaration.type = :type', { type });
    }
    
    if (status) {
      queryBuilder.andWhere('declaration.status = :status', { status });
    }
    
    if (period) {
      queryBuilder.andWhere('declaration.period LIKE :period', { period: `${period}%` });
    }
    
    // Filtrer par catégorie si spécifiée
    if (category) {
      const typesInCategory = this.getDeclarationTypesByCategory(category);
      if (typesInCategory.length > 0) {
        queryBuilder.andWhere('declaration.type IN (:...types)', { types: typesInCategory });
      }
    }
    
    // Obtenir le total
    const total = await queryBuilder.getCount();
    
    // Paginer les résultats
    const data = await queryBuilder
      .orderBy('declaration.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getMany();
      
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  async findById(id: string): Promise<Declaration> {
    const declaration = await this.declarationRepository.findOne({ 
      where: { id },
      relations: ['attachments']
    });
    
    if (!declaration) {
      throw new NotFoundException(`Déclaration avec ID ${id} non trouvée`);
    }
    
    return declaration;
  }

  async update(id: string, updateDto: UpdateDeclarationDto, userId: string): Promise<Declaration> {
    const declaration = await this.findById(id);
    
    // Vérifier que la déclaration n'est pas déjà soumise ou validée
    if (declaration.status !== DeclarationStatus.DRAFT && declaration.status !== DeclarationStatus.REJECTED) {
      throw new BadRequestException(`La déclaration ne peut pas être modifiée dans l'état actuel ${declaration.status}`);
    }
    
    // Mettre à jour les champs
    Object.assign(declaration, updateDto);
    
    return this.declarationRepository.save(declaration);
  }

  async updateStatus(id: string, updateStatusDto: UpdateDeclarationStatusDto, userId: string): Promise<Declaration> {
    const declaration = await this.findById(id);
    const { status, reason, validatorId } = updateStatusDto;
    
    // Valider les transitions d'état
    this.validateStatusTransition(declaration.status, status);
    
    // Mettre à jour le statut
    declaration.status = status;
    
    // Ajouter les informations spécifiques en fonction du statut
    switch (status) {
      case DeclarationStatus.SUBMITTED:
        declaration.submittedAt = new Date();
        declaration.submittedBy = userId;
        break;
      case DeclarationStatus.VALIDATED:
        if (!validatorId) {
          throw new BadRequestException('Un ID de validateur est requis pour valider la déclaration');
        }
        declaration.validatedAt = new Date();
        declaration.validatedBy = validatorId;
        break;
      case DeclarationStatus.REJECTED:
        if (!reason) {
          throw new BadRequestException('Une raison de rejet est requise');
        }
        declaration.rejectedAt = new Date();
        declaration.rejectionReason = reason;
        break;
    }
    
    return this.declarationRepository.save(declaration);
  }

  async addAttachment(declarationId: string, attachment: Express.Multer.File, type: string, userId: string): Promise<DeclarationAttachment> {
    const declaration = await this.findById(declarationId);
    
    // TODO: Upload file to storage and get URL
    const fileUrl = `/attachments/${declarationId}/${attachment.originalname}`;
    
    const newAttachment = this.attachmentRepository.create({
      declarationId,
      name: attachment.originalname,
      type: type as any, // Cast to AttachmentType
      url: fileUrl,
      size: attachment.size
    });
    
    return this.attachmentRepository.save(newAttachment);
  }

  async getAttachments(declarationId: string): Promise<DeclarationAttachment[]> {
    return this.attachmentRepository.find({
      where: { declarationId }
    });
  }

  private calculateDueDateAndPeriodicity(type: DeclarationType, period: string): { periodicity: Periodicity, dueDate: Date } {
    // Configuration des types de déclaration
    const declarationConfig = {
      [DeclarationType.IBP]: { periodicity: Periodicity.ANNUAL, dueDays: 90 }, // 31 mars = 90 jours
      [DeclarationType.TVA]: { periodicity: Periodicity.MONTHLY, dueDays: 15 },
      [DeclarationType.IPR]: { periodicity: Periodicity.MONTHLY, dueDays: 15 },
      // Ajouter autres types ici
    };
    
    const config = declarationConfig[type] || { periodicity: Periodicity.MONTHLY, dueDays: 15 };
    
    // Calculer la date d'échéance
    const periodDate = new Date(period);
    let dueDate: Date;
    
    if (config.periodicity === Periodicity.MONTHLY) {
      // Pour les déclarations mensuelles: 15 du mois suivant
      dueDate = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 15);
    } else if (config.periodicity === Periodicity.QUARTERLY) {
      // Pour les déclarations trimestrielles
      dueDate = new Date(periodDate.getFullYear(), periodDate.getMonth() + 3, 15);
    } else if (config.periodicity === Periodicity.ANNUAL) {
      // Pour les déclarations annuelles (ex: IBP - 31 mars)
      dueDate = new Date(periodDate.getFullYear() + 1, 2, 31); // 31 mars de l'année suivante
    } else {
      // Par défaut
      dueDate = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, config.dueDays);
    }
    
    return {
      periodicity: config.periodicity,
      dueDate
    };
  }

  private generateReference(type: DeclarationType, period: string): string {
    const date = new Date(period);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${type}-${year}-${month}-${random}`;
  }

  private validateStatusTransition(currentStatus: DeclarationStatus, newStatus: DeclarationStatus): void {
    // Définir les transitions valides avec typage explicite
    const validTransitions: Record<DeclarationStatus, DeclarationStatus[]> = {
      [DeclarationStatus.DRAFT]: [DeclarationStatus.PENDING, DeclarationStatus.SUBMITTED],
      [DeclarationStatus.PENDING]: [DeclarationStatus.SUBMITTED, DeclarationStatus.DRAFT],
      [DeclarationStatus.SUBMITTED]: [DeclarationStatus.VALIDATED, DeclarationStatus.REJECTED],
      [DeclarationStatus.REJECTED]: [DeclarationStatus.DRAFT, DeclarationStatus.SUBMITTED],
      [DeclarationStatus.VALIDATED]: [] // Statut final, pas de transition possible
    };
    
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Transition de statut invalide: ${currentStatus} -> ${newStatus}`);
    }
  }

  private getDeclarationTypesByCategory(category: string): DeclarationType[] {
    const categoriesMap = {
      'direct_tax': [
        DeclarationType.IBP, 
        DeclarationType.IPR, 
        DeclarationType.IRCM, 
        DeclarationType.IRVM, 
        DeclarationType.IPF
      ],
      'indirect_tax': [
        DeclarationType.TVA,
        DeclarationType.TPI,
        DeclarationType.TCR,
        DeclarationType.TE,
        DeclarationType.TAD,
        DeclarationType.TRD
      ],
      'social_contribution': [
        DeclarationType.CNSS,
        DeclarationType.INPP,
        DeclarationType.ONEM
      ],
      'special_tax': [
        DeclarationType.TSD,
        DeclarationType.TPU,
        DeclarationType.TSE,
        DeclarationType.AUTRES
      ]
    };
    
    return categoriesMap[category] || [];
  }

  async getStatistics(period?: string): Promise<any> {
    // Construire une requête de base
    const queryBuilder = this.declarationRepository.createQueryBuilder('declaration');
    
    // Filtrer par période si spécifiée
    if (period) {
      queryBuilder.andWhere('declaration.period LIKE :period', { period: `${period}%` });
    }
    
    // Récupérer toutes les déclarations correspondantes
    const declarations = await queryBuilder.getMany();
    
    // Calculer les statistiques
    const totalDeclarations = declarations.length;
    const totalAmount = declarations.reduce((sum, decl) => sum + Number(decl.amount), 0);
    
    // Grouper par statut
    const byStatus = declarations.reduce((acc, decl) => {
      acc[decl.status] = (acc[decl.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Grouper par type
    const byType = declarations.reduce((acc, decl) => {
      acc[decl.type] = (acc[decl.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Compter les déclarations en retard
    const now = new Date();
    const overdueCount = declarations.filter(decl => 
      new Date(decl.dueDate) < now && 
      (decl.status === DeclarationStatus.DRAFT || decl.status === DeclarationStatus.PENDING)
    ).length;
    
    return {
      totalDeclarations,
      totalAmount,
      byStatus,
      byType,
      overdueCount
    };
  }
}
