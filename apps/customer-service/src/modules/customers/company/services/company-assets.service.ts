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
        state: this.mapAssetState(createAssetDto.asset.etatActuel),
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
      if (updateAssetDto.asset.etatActuel) asset.state = this.mapAssetState(updateAssetDto.asset.etatActuel);
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
      await this.findCompanyById(companyId);
      
      const assets = await this.assetsRepository.find({
        where: { companyId, isActive: true }
      });

      return assets.map(asset => this.mapEntityToResponseDto(asset));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des actifs: ${(error as Error).message}`);
    }
  }

  /**
   * Récupérer un actif spécifique
   */
  async getAssetById(companyId: string, assetId: string): Promise<AssetResponseDto> {
    try {
      await this.findCompanyById(companyId);
      
      const asset = await this.assetsRepository.findOne({
        where: { id: assetId, companyId, isActive: true }
      });

      if (!asset) {
        throw new Error(`Actif avec l'ID ${assetId} non trouvé`);
      }

      return this.mapEntityToResponseDto(asset);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'actif: ${(error as Error).message}`);
    }
  }

  /**
   * Récupérer les actifs par type
   */
  async getAssetsByType(companyId: string, assetType: AssetType): Promise<AssetResponseDto[]> {
    try {
      await this.findCompanyById(companyId);
      
      const assets = await this.assetsRepository.find({
        where: { companyId, type: assetType, isActive: true }
      });

      return assets.map(asset => this.mapEntityToResponseDto(asset));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des actifs par type: ${(error as Error).message}`);
    }
  }

  /**
   * Récupérer les actifs par état
   */
  async getAssetsByState(companyId: string, assetState: AssetState): Promise<AssetResponseDto[]> {
    try {
      await this.findCompanyById(companyId);
      
      const mappedState = this.mapAssetState(assetState);
      const assets = await this.assetsRepository.find({
        where: { companyId, state: mappedState, isActive: true }
      });

      return assets.map(asset => this.mapEntityToResponseDto(asset));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des actifs par état: ${(error as Error).message}`);
    }
  }

  /**
   * Supprimer un actif
   */
  async deleteAsset(companyId: string, assetId: string): Promise<boolean> {
    try {
      await this.findCompanyById(companyId);
      
      const asset = await this.assetsRepository.findOne({
        where: { id: assetId, companyId }
      });

      if (!asset) {
        throw new Error(`Actif avec l'ID ${assetId} non trouvé`);
      }

      // Soft delete - marquer comme inactif
      asset.isActive = false;
      asset.disposalDate = new Date();
      asset.disposalReason = 'Supprimé par l\'utilisateur';

      await this.assetsRepository.save(asset);
      return true;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l'actif: ${(error as Error).message}`);
    }
  }

  /**
   * Calculer la valeur totale des actifs
   */
  async calculateTotalAssetValue(companyId: string): Promise<number> {
    try {
      await this.findCompanyById(companyId);
      
      const result = await this.assetsRepository
        .createQueryBuilder('asset')
        .select('SUM(asset.currentValue)', 'total')
        .where('asset.companyId = :companyId AND asset.isActive = :isActive', { 
          companyId, 
          isActive: true 
        })
        .getRawOne();

      return parseFloat(result.total) || 0;
    } catch (error) {
      throw new Error(`Erreur lors du calcul de la valeur totale des actifs: ${(error as Error).message}`);
    }
  }

  /**
   * Récupérer les statistiques des actifs
   */
  async getAssetStatistics(companyId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    assetsByType: Record<string, number>;
    assetsByState: Record<string, number>;
  }> {
    try {
      await this.findCompanyById(companyId);
      
      const assets = await this.assetsRepository.find({
        where: { companyId, isActive: true }
      });

      const totalAssets = assets.length;
      const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

      // Comptage par type
      const assetsByType = assets.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Comptage par état
      const assetsByState = assets.reduce((acc, asset) => {
        acc[asset.state] = (acc[asset.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAssets,
        totalValue,
        assetsByType,
        assetsByState,
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${(error as Error).message}`);
    }
  }

  /**
   * Mettre à jour l'état d'un actif
   */
  async updateAssetState(companyId: string, assetId: string, newState: AssetState): Promise<AssetResponseDto> {
    try {
      await this.findCompanyById(companyId);
      
      const asset = await this.assetsRepository.findOne({
        where: { id: assetId, companyId }
      });

      if (!asset) {
        throw new Error(`Actif avec l'ID ${assetId} non trouvé`);
      }

      asset.state = this.mapAssetState(newState);
      const savedAsset = await this.assetsRepository.save(asset);
      
      return this.mapEntityToResponseDto(savedAsset);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'état de l'actif: ${(error as Error).message}`);
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
    if (!asset.designation) {
      throw new Error('La désignation de l\'actif est obligatoire');
    }
    if (!asset.type) {
      throw new Error('Le type d\'actif est obligatoire');
    }
  }

  private mapTypeToCategory(type: AssetType): string {
    const mapping = {
      [AssetType.IMMOBILIER]: 'real_estate',
      [AssetType.VEHICULE]: 'vehicles',
      [AssetType.EQUIPEMENT]: 'equipment',
      [AssetType.AUTRE]: 'other'
    };
    return mapping[type] || 'other';
  }

  private mapAssetState(state?: AssetState): string {
    if (!state) return 'good';
    
    const mapping = {
      [AssetState.NEUF]: 'excellent',
      [AssetState.EXCELLENT]: 'excellent',
      [AssetState.BON]: 'good',
      [AssetState.MOYEN]: 'fair',
      [AssetState.MAUVAIS]: 'poor',
      [AssetState.DETERIORE]: 'damaged'
    };
    return mapping[state] || 'good';
  }

  private mapEntityToResponseDto(asset: CompanyAssetsEntity): AssetResponseDto {
    return {
      id: asset.id,
      companyId: asset.companyId,
      designation: asset.name,
      type: asset.type as AssetType,
      description: asset.description,
      prixAchat: asset.acquisitionCost,
      valeurActuelle: asset.currentValue,
      devise: asset.currency as any,
      dateAcquisition: asset.acquisitionDate.toISOString(),
      etatActuel: this.mapEntityStateToDto(asset.state),
      localisation: asset.location,
      marque: asset.brand,
      numeroSerie: asset.serialNumber,
      observations: asset.notes,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };
  }

  private mapEntityStateToDto(state: string): AssetState | undefined {
    const mapping = {
      'excellent': AssetState.EXCELLENT,
      'very_good': AssetState.EXCELLENT,
      'good': AssetState.BON,
      'fair': AssetState.MOYEN,
      'poor': AssetState.MAUVAIS,
      'damaged': AssetState.DETERIORE,
      'obsolete': AssetState.DETERIORE
    };
    return mapping[state];
  }
}