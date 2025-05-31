import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { AssetValuation } from '../entities/asset-valuation.entity';
import { CreateAssetDto, UpdateAssetDto, AssetFilterDto } from '../dtos/asset.dto';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetValuation)
    private valuationRepository: Repository<AssetValuation>,
  ) {}

  async create(createAssetDto: CreateAssetDto, userId: string): Promise<Asset> {
    const kiotaId = `KIOTA-AST-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const asset = this.assetRepository.create({
      ...createAssetDto,
      kiotaId,
      createdBy: userId,
    });

    return await this.assetRepository.save(asset);
  }

  async findAll(
    filters: AssetFilterDto,
    page = 1,
    perPage = 10,
  ): Promise<{
    assets: Asset[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.search) {
      where.name = Like(`%${filters.search}%`);
    }

    const [assets, total] = await this.assetRepository.findAndCount({
      where,
      relations: ['valuations'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      assets,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: ['valuations'],
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findById(id);
    Object.assign(asset, updateAssetDto);
    return await this.assetRepository.save(asset);
  }

  async addMaintenanceRecord(
    id: string,
    record: {
      date: Date;
      type: string;
      description: string;
      cost: number;
      provider: string;
    },
  ): Promise<Asset> {
    const asset = await this.findById(id);
    asset.maintenanceHistory.push(record);
    return await this.assetRepository.save(asset);
  }

  async updateInsurance(
    id: string,
    insuranceInfo: {
      provider: string;
      policyNumber: string;
      coverage: string[];
      startDate: Date;
      endDate: Date;
      cost: number;
    },
  ): Promise<Asset> {
    const asset = await this.findById(id);
    asset.insuranceInfo = insuranceInfo;
    return await this.assetRepository.save(asset);
  }

  async addValuation(
    id: string,
    valuation: Partial<AssetValuation>,
  ): Promise<AssetValuation> {
    const asset = await this.findById(id);
    
    const newValuation = this.valuationRepository.create({
      ...valuation,
      assetId: asset.id,
    });

    const savedValuation = await this.valuationRepository.save(newValuation);

    // Mettre à jour la valeur actuelle de l'actif
    asset.currentValue = savedValuation.value;
    await this.assetRepository.save(asset);

    return savedValuation;
  }

  async getValuationHistory(id: string): Promise<AssetValuation[]> {
    const asset = await this.findById(id);
    return await this.valuationRepository.find({
      where: { assetId: asset.id },
      order: { valuationDate: 'DESC' },
    });
  }

  async getDepreciationSchedule(id: string): Promise<{
    initialValue: number;
    currentValue: number;
    depreciationRate: number;
    schedule: {
      year: number;
      value: number;
      depreciation: number;
    }[];
  }> {
    const asset = await this.findById(id);
    const years = 5; // Exemple: amortissement sur 5 ans
    const depreciationRate = 0.2; // 20% par an

    const schedule = [];
    let currentValue = asset.acquisitionValue;

    for (let i = 1; i <= years; i++) {
      const depreciation = asset.acquisitionValue * depreciationRate;
      currentValue -= depreciation;

      schedule.push({
        year: new Date().getFullYear() + i,
        value: currentValue,
        depreciation,
      });
    }

    return {
      initialValue: asset.acquisitionValue,
      currentValue: asset.currentValue,
      depreciationRate,
      schedule,
    };
  }
}