import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyCoreEntity } from '../entities/company-core.entity';
import { CompanyAssetsEntity } from '../entities/company-assets.entity';
import { 
  AssetDataDto,
  CreateAssetDto,
  UpdateAssetDto,
  UpdateAssetDataDto,
  AssetResponseDto,
  AssetType,
  AssetState,
  PropertyStatus
} from '../dto/company-assets.dto';

/**
 * Service pour la gestion des actifs des entreprises
 * Gère les biens immobiliers, véhicules, équipements et autres actifs
 */
@Injectable()
export class CompanyAssetsService {
  constructor(
    @InjectRepository(CompanyCoreEntity)
    private readonly companyRepository: Repository<CompanyCoreEntity>,
    @InjectRepository(CompanyAssetsEntity)
    private readonly assetsRepository: Repository<CompanyAssetsEntity>,
  ) {}

  /**
   * Ajouter un actif à une entreprise
   */
  async addAsset(createAssetDto: CreateAssetDto): Promise<AssetResponseDto> {
    try {
      const company = await this.findCompanyById(createAssetDto.companyId);
      
      // Validation des données d'actif
      this.validateAssetData(createAssetDto.asset);

      // Création de l'entité asset
      const newAsset = this.assetsRepository.create({
        companyId: createAssetDto.companyId,
        name: createAssetDto.asset.designation,
        description: createAssetDto.asset.description,
        type: createAssetDto.asset.type,
        category: this.mapTypeToCategory(createAssetDto.asset.type),
        state: createAssetDto.asset.etatActuel || 'good',
        acquisitionCost: createAssetDto.asset.prixAchat || 0,
        currentValue: createAssetDto.asset.valeurActuelle || createAssetDto.asset.prixAchat || 0,
        currency: createAssetDto.asset.devise || 'CDF',
        acquisitionDate: createAssetDto.asset.dateAcquisition ? new Date(createAssetDto.asset.dateAcquisition) : new Date(),
        location: createAssetDto.asset.localisation,
        serialNumber: createAssetDto.asset.numeroSerie,
        brand: createAssetDto.asset.marque,
        notes: createAssetDto.asset.observations,
        company: company,
      });

      const savedAsset = await this.assetsRepository.save(newAsset);
      return this.mapEntityToResponseDto(savedAsset);
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout de l'actif: ${(error as Error).message}`);
    }
  }

  /**
   * Mettre à jour un actif
   */
  async updateAsset(updateAssetDto: UpdateAssetDto): Promise<AssetResponseDto> {
    try {
      await this.findCompanyById(updateAssetDto.companyId);
      
      const asset = await this.assetsRepository.findOne({
        where: { id: updateAssetDto.assetId, companyId: updateAssetDto.companyId }
      });

      if (!asset) {
        throw new Error(`Actif avec l'ID ${updateAssetDto.assetId} non trouvé`);
      }

      // Mise à jour de l'actif
      if (updateAssetDto.asset.designation) asset.name = updateAssetDto.asset.designation;
      if (updateAssetDto.asset.description) asset.description = updateAssetDto.asset.description;
      if (updateAssetDto.asset.type) {
        asset.type = updateAssetDto.asset.type;
        asset.category = this.mapTypeToCategory(updateAssetDto.asset.type);
      }
      if (updateAssetDto.asset.etatActuel) asset.state = updateAssetDto.asset.etatActuel;
      if (updateAssetDto.asset.prixAchat) asset.acquisitionCost = updateAssetDto.asset.prixAchat;
      if (updateAssetDto.asset.valeurActuelle) asset.currentValue = updateAssetDto.asset.valeurActuelle;
      if (updateAssetDto.asset.devise) asset.currency = updateAssetDto.asset.devise;
      if (updateAssetDto.asset.dateAcquisition) asset.acquisitionDate = new Date(updateAssetDto.asset.dateAcquisition);
      if (updateAssetDto.asset.localisation) asset.location = updateAssetDto.asset.localisation;
      if (updateAssetDto.asset.numeroSerie) asset.serialNumber = updateAssetDto.asset.numeroSerie;
      if (updateAssetDto.asset.marque) asset.brand = updateAssetDto.asset.marque;
      if (updateAssetDto.asset.observations) asset.notes = updateAssetDto.asset.observations;

      const savedAsset = await this.assetsRepository.save(asset);
      return this.mapEntityToResponseDto(savedAsset);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'actif: ${(error as Error).message}`);
    }
  }

  /**
   * Récupérer tous les actifs d'une entreprise
   */
  async getCompanyAssets(companyId: string): Promise<AssetResponseDto[]> {
    try {
      const company = await this.findCompanyById(companyId);
      
      if (!company.assetData) {
        return [];
      }

      return company.assetData.map(asset => this.mapAssetToResponseDto(asset, companyId));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des actifs: ${error.message}`);
    }
  }

  /**
   * Récupérer un actif spécifique
   */
  async getAssetById(companyId: string, assetId: string): Promise<AssetResponseDto> {
    try {
      const company = await this.findCompanyById(companyId);
      
      if (!company.assetData) {
        throw new Error('Aucun actif trouvé pour cette entreprise');
      }

      const asset = company.assetData.find(asset => asset.id === assetId);
      if (!asset) {
        throw new Error(`Actif avec l'ID ${assetId} non trouvé`);
      }

      return this.mapAssetToResponseDto(asset, companyId);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'actif: ${error.message}`);
    }
  }

  /**
   * Récupérer les actifs par type
   */
  async getAssetsByType(companyId: string, assetType: AssetType): Promise<AssetResponseDto[]> {
    try {
      const company = await this.findCompanyById(companyId);
      
      if (!company.assetData) {
        return [];
      }

      const filteredAssets = company.assetData.filter(asset => asset.type === assetType);
      return filteredAssets.map(asset => this.mapAssetToResponseDto(asset, companyId));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des actifs par type: ${error.message}`);
    }
  }

  /**
   * Récupérer les actifs par état
   */
  async getAssetsByState(companyId: string, assetState: AssetState): Promise<AssetResponseDto[]> {
    try {
      const company = await this.findCompanyById(companyId);
      
      if (!company.assetData) {
        return [];
      }

      const filteredAssets = company.assetData.filter(asset => asset.state === assetState);
      return filteredAssets.map(asset => this.mapAssetToResponseDto(asset, companyId));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des actifs par état: ${error.message}`);
    }
  }

  /**
   * Supprimer un actif
   */
  async deleteAsset(companyId: string, assetId: string): Promise<boolean> {
    try {
      const company = await this.findCompanyById(companyId);
      
      if (!company.assetData) {
        throw new Error('Aucun actif trouvé pour cette entreprise');
      }

      const assetIndex = company.assetData.findIndex(asset => asset.id === assetId);
      if (assetIndex === -1) {
        throw new Error(`Actif avec l'ID ${assetId} non trouvé`);
      }

      company.assetData.splice(assetIndex, 1);
      company.updatedAt = new Date();

      await this.companyRepository.save(company);
      return true;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l'actif: ${error.message}`);
    }
  }

  /**
   * Calculer la valeur totale des actifs
   */
  async calculateTotalAssetValue(companyId: string): Promise<number> {
    try {
      const company = await this.findCompanyById(companyId);
      
      if (!company.assetData || company.assetData.length === 0) {
        return 0;
      }

      return company.assetData.reduce((total, asset) => {
        return total + (asset.currentValue || asset.purchaseValue || 0);
      }, 0);
    } catch (error) {
      throw new Error(`Erreur lors du calcul de la valeur totale des actifs: ${error.message}`);
    }
  }

  /**
   * Récupérer les statistiques des actifs
   */
  async getAssetStatistics(companyId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    assetsByType: Record<AssetType, number>;
    assetsByState: Record<AssetState, number>;
  }> {
    try {
      const company = await this.findCompanyById(companyId);
      
      if (!company.assetData) {
        return {
          totalAssets: 0,
          totalValue: 0,
          assetsByType: {} as Record<AssetType, number>,
          assetsByState: {} as Record<AssetState, number>,
        };
      }

      const totalAssets = company.assetData.length;
      const totalValue = await this.calculateTotalAssetValue(companyId);

      // Comptage par type
      const assetsByType = company.assetData.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {} as Record<AssetType, number>);

      // Comptage par état
      const assetsByState = company.assetData.reduce((acc, asset) => {
        acc[asset.state] = (acc[asset.state] || 0) + 1;
        return acc;
      }, {} as Record<AssetState, number>);

      return {
        totalAssets,
        totalValue,
        assetsByType,
        assetsByState,
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Mettre à jour l'état d'un actif
   */
  async updateAssetState(companyId: string, assetId: string, newState: AssetState): Promise<AssetResponseDto> {
    try {
      const company = await this.findCompanyById(companyId);
      
      if (!company.assetData) {
        throw new Error('Aucun actif trouvé pour cette entreprise');
      }

      const assetIndex = company.assetData.findIndex(asset => asset.id === assetId);
      if (assetIndex === -1) {
        throw new Error(`Actif avec l'ID ${assetId} non trouvé`);
      }

      company.assetData[assetIndex].state = newState;
      company.assetData[assetIndex].updatedAt = new Date().toISOString();
      company.updatedAt = new Date();

      await this.companyRepository.save(company);
      return this.mapAssetToResponseDto(company.assetData[assetIndex], companyId);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'état de l'actif: ${error.message}`);
    }
  }

  // Méthodes utilitaires privées
  private async findCompanyById(companyId: string): Promise<CompanyCoreEntity> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    return company;
  }

  private validateAssetData(asset: AssetDataDto): void {
    if (!asset.name) {
      throw new Error('Le nom de l\'actif est obligatoire');
    }
    if (!asset.type) {
      throw new Error('Le type d\'actif est obligatoire');
    }
    if (!asset.state) {
      throw new Error('L\'état de l\'actif est obligatoire');
    }
    if (!asset.purchaseValue || asset.purchaseValue <= 0) {
      throw new Error('La valeur d\'achat doit être positive');
    }
    if (!asset.currency) {
      throw new Error('La devise est obligatoire');
    }
  }

  private generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapAssetToResponseDto(asset: AssetDataDto & { id: string; createdAt: string; updatedAt: string }, companyId: string): AssetResponseDto {
    return {
      id: asset.id,
      companyId: companyId,
      name: asset.name,
      type: asset.type,
      state: asset.state,
      description: asset.description,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate,
      purchaseValue: asset.purchaseValue,
      currentValue: asset.currentValue,
      currency: asset.currency,
      location: asset.location,
      condition: asset.condition,
      warrantyExpiration: asset.warrantyExpiration,
      maintenanceSchedule: asset.maintenanceSchedule,
      lastMaintenanceDate: asset.lastMaintenanceDate,
      nextMaintenanceDate: asset.nextMaintenanceDate,
      insurancePolicy: asset.insurancePolicy,
      insuranceExpiration: asset.insuranceExpiration,
      images: asset.images,
      documents: asset.documents,
      propertyDetails: asset.propertyDetails,
      vehicleDetails: asset.vehicleDetails,
      equipmentDetails: asset.equipmentDetails,
      depreciationRate: asset.depreciationRate,
      residualValue: asset.residualValue,
      usefulLife: asset.usefulLife,
      notes: asset.notes,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }
}