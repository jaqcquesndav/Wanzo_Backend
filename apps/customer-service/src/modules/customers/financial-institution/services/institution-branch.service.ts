import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionBranch } from '../entities/institution-branch.entity';
import { 
  CreateBranchDto, 
  UpdateBranchDto, 
  BranchResponseDto,
  BranchOperationalDataDto,
  BranchPerformanceDto,
  BranchStaffDto
} from '../dto/institution-branches.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion des succursales/agences des institutions financières
 * Gère les données opérationnelles, performances et personnel des succursales
 */
@Injectable()
export class InstitutionBranchService {
  constructor(
    @InjectRepository(InstitutionBranch)
    private readonly branchRepository: Repository<InstitutionBranch>,
  ) {}

  /**
   * Ajouter une nouvelle agence à une institution financière
   */
  async addBranch(institutionId: string, createBranchDto: CreateBranchDto): Promise<BranchResponseDto> {
    try {
      // Vérification de l'unicité du code d'agence
      await this.checkBranchCodeUniqueness(institutionId, createBranchDto.branch.code);

      // Création de la nouvelle agence avec ID unique
      const branchId = crypto.randomUUID();
      const currentDate = new Date().toISOString();
      
      const newBranch = this.branchRepository.create({
        id: branchId,
        institutionId,
        code: createBranchDto.branch.code,
        name: createBranchDto.branch.name,
        address: createBranchDto.branch.address,
        coordinates: createBranchDto.branch.coordinates,
        manager: createBranchDto.branch.manager,
        phone: createBranchDto.branch.phone,
        email: createBranchDto.branch.email,
        openingHours: createBranchDto.branch.openingHours,
        services: createBranchDto.branch.services || [],
        operationalData: createBranchDto.branch.operationalData,
        performance: createBranchDto.branch.performance,
        staff: createBranchDto.branch.staff || [],
        isActive: true,
        createdAt: new Date(currentDate),
        updatedAt: new Date(currentDate),
      });

      const savedBranch = await this.branchRepository.save(newBranch);
      
      return this.mapToBranchResponseDto(savedBranch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de l'agence: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour une agence existante
   */
  async updateBranch(branchId: string, updateBranchDto: UpdateBranchDto): Promise<BranchResponseDto> {
    try {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      
      if (!branch) {
        throw new Error('Agence non trouvée');
      }

      // Vérification de l'unicité du code si modifié
      if (updateBranchDto.branch?.code && updateBranchDto.branch.code !== branch.code) {
        await this.checkBranchCodeUniqueness(branch.institutionId, updateBranchDto.branch.code, branchId);
      }

      // Mise à jour des données
      const updatedBranch = this.branchRepository.merge(branch, {
        ...updateBranchDto.branch,
        updatedAt: new Date(),
      });

      const savedBranch = await this.branchRepository.save(updatedBranch);
      
      return this.mapToBranchResponseDto(savedBranch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour de l'agence: ${errorMessage}`);
    }
  }

  /**
   * Récupérer toutes les agences d'une institution
   */
  async getBranches(institutionId: string, page = 1, limit = 10): Promise<{ branches: BranchResponseDto[], total: number }> {
    try {
      const [branches, total] = await this.branchRepository.findAndCount({
        where: { institutionId },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' }
      });

      return {
        branches: branches.map(branch => this.mapToBranchResponseDto(branch)),
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des agences: ${errorMessage}`);
    }
  }

  /**
   * Récupérer une agence par ID
   */
  async getBranchById(branchId: string): Promise<BranchResponseDto> {
    try {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      
      if (!branch) {
        throw new Error('Agence non trouvée');
      }

      return this.mapToBranchResponseDto(branch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération de l'agence: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les agences par région/ville
   */
  async getBranchesByLocation(institutionId: string, city: string): Promise<BranchResponseDto[]> {
    try {
      const branches = await this.branchRepository
        .createQueryBuilder('branch')
        .where('branch.institutionId = :institutionId', { institutionId })
        .andWhere('branch.address ILIKE :city', { city: `%${city}%` })
        .orderBy('branch.name', 'ASC')
        .getMany();

      return branches.map(branch => this.mapToBranchResponseDto(branch));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des agences par localisation: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les agences actives
   */
  async getActiveBranches(institutionId: string): Promise<BranchResponseDto[]> {
    try {
      const branches = await this.branchRepository.find({
        where: { institutionId, isActive: true },
        order: { name: 'ASC' }
      });

      return branches.map(branch => this.mapToBranchResponseDto(branch));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des agences actives: ${errorMessage}`);
    }
  }

  /**
   * Supprimer une agence (soft delete)
   */
  async deleteBranch(branchId: string): Promise<void> {
    try {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      
      if (!branch) {
        throw new Error('Agence non trouvée');
      }

      // Soft delete en désactivant l'agence
      branch.isActive = false;
      branch.updatedAt = new Date();
      
      await this.branchRepository.save(branch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la suppression de l'agence: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour le statut d'une agence
   */
  async updateBranchStatus(branchId: string, isActive: boolean): Promise<BranchResponseDto> {
    try {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      
      if (!branch) {
        throw new Error('Agence non trouvée');
      }

      branch.isActive = isActive;
      branch.updatedAt = new Date();
      
      const updatedBranch = await this.branchRepository.save(branch);
      
      return this.mapToBranchResponseDto(updatedBranch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour du statut: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour les données opérationnelles d'une agence
   */
  async updateOperationalData(branchId: string, operationalData: BranchOperationalDataDto): Promise<BranchResponseDto> {
    try {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      
      if (!branch) {
        throw new Error('Agence non trouvée');
      }

      branch.operationalData = {
        ...branch.operationalData,
        ...operationalData,
      };
      branch.updatedAt = new Date();
      
      const updatedBranch = await this.branchRepository.save(branch);
      
      return this.mapToBranchResponseDto(updatedBranch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour des données opérationnelles: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour les performances d'une agence
   */
  async updatePerformance(branchId: string, performance: BranchPerformanceDto): Promise<BranchResponseDto> {
    try {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      
      if (!branch) {
        throw new Error('Agence non trouvée');
      }

      branch.performance = {
        ...branch.performance,
        ...performance,
      };
      branch.updatedAt = new Date();
      
      const updatedBranch = await this.branchRepository.save(branch);
      
      return this.mapToBranchResponseDto(updatedBranch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour des performances: ${errorMessage}`);
    }
  }

  /**
   * Ajouter un membre du personnel à une agence
   */
  async addStaffMember(branchId: string, staffMember: BranchStaffDto): Promise<BranchResponseDto> {
    try {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      
      if (!branch) {
        throw new Error('Agence non trouvée');
      }

      const newStaffMember = {
        ...staffMember,
        id: crypto.randomUUID(),
        startDate: staffMember.startDate || new Date().toISOString(),
      };

      branch.staff = [...(branch.staff || []), newStaffMember];
      branch.updatedAt = new Date();
      
      const updatedBranch = await this.branchRepository.save(branch);
      
      return this.mapToBranchResponseDto(updatedBranch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout du membre du personnel: ${errorMessage}`);
    }
  }

  /**
   * Supprimer un membre du personnel d'une agence
   */
  async removeStaffMember(branchId: string, staffId: string): Promise<BranchResponseDto> {
    try {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      
      if (!branch) {
        throw new Error('Agence non trouvée');
      }

      branch.staff = (branch.staff || []).filter(staff => staff.id !== staffId);
      branch.updatedAt = new Date();
      
      const updatedBranch = await this.branchRepository.save(branch);
      
      return this.mapToBranchResponseDto(updatedBranch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la suppression du membre du personnel: ${errorMessage}`);
    }
  }

  /**
   * Générer un rapport de réseau d'agences
   */
  async generateNetworkReport(institutionId: string): Promise<any> {
    try {
      const branches = await this.branchRepository.find({
        where: { institutionId }
      });

      const activeBranches = branches.filter(branch => branch.isActive);
      const totalStaff = branches.reduce((sum, branch) => sum + (branch.staff?.length || 0), 0);

      // Répartition géographique
      const locationBreakdown: { [key: string]: number } = {};
      for (const branch of branches) {
        const location = this.extractCityFromAddress(branch.address);
        locationBreakdown[location] = (locationBreakdown[location] || 0) + 1;
      }

      // Performances globales
      const totalRevenue = branches.reduce((sum, branch) => 
        sum + (branch.performance?.monthlyRevenue || 0), 0
      );

      const averageCustomerSatisfaction = branches.length > 0 ?
        branches.reduce((sum, branch) => 
          sum + (branch.performance?.customerSatisfaction || 0), 0
        ) / branches.length : 0;

      return {
        summary: {
          totalBranches: branches.length,
          activeBranches: activeBranches.length,
          totalStaff,
          totalRevenue,
          averageCustomerSatisfaction,
        },
        locationBreakdown,
        branches: branches.map(branch => this.mapToBranchResponseDto(branch)),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la génération du rapport: ${errorMessage}`);
    }
  }

  // Méthodes privées

  /**
   * Vérifier l'unicité du code d'agence
   */
  private async checkBranchCodeUniqueness(institutionId: string, code: string, excludeBranchId?: string): Promise<void> {
    const existingBranch = await this.branchRepository
      .createQueryBuilder('branch')
      .where('branch.institutionId = :institutionId', { institutionId })
      .andWhere('branch.code = :code', { code })
      .andWhere(excludeBranchId ? 'branch.id != :excludeBranchId' : '1=1', { excludeBranchId })
      .getOne();

    if (existingBranch) {
      throw new Error(`Une agence avec le code "${code}" existe déjà`);
    }
  }

  /**
   * Extraire la ville à partir de l'adresse
   */
  private extractCityFromAddress(address: any): string {
    if (typeof address === 'string') {
      // Si l'adresse est une chaîne, essayer d'extraire la ville
      const parts = address.split(',');
      return parts[parts.length - 1]?.trim() || 'Non spécifiée';
    }
    
    if (typeof address === 'object' && address.city) {
      return address.city;
    }
    
    return 'Non spécifiée';
  }

  /**
   * Mapper l'entité Branch vers BranchResponseDto
   */
  private mapToBranchResponseDto(branch: InstitutionBranch): BranchResponseDto {
    return {
      id: branch.id,
      institutionId: branch.institutionId,
      code: branch.code,
      name: branch.name,
      address: branch.address,
      coordinates: branch.coordinates,
      manager: branch.manager,
      phone: branch.phone,
      email: branch.email,
      openingHours: branch.openingHours,
      services: branch.services || [],
      operationalData: branch.operationalData,
      performance: branch.performance,
      staff: branch.staff || [],
      isActive: branch.isActive,
      createdAt: branch.createdAt.toISOString(),
      updatedAt: branch.updatedAt.toISOString(),
    };
  }
}