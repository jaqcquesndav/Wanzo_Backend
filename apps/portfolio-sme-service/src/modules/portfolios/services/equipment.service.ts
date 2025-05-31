import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Equipment } from '../entities/equipment.entity';
import { CreateEquipmentDto, UpdateEquipmentDto, EquipmentFilterDto } from '../dtos/equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    const kiotaId = `KIOTA-EQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const equipment = this.equipmentRepository.create({
      ...createEquipmentDto,
      kiotaId,
    });

    return await this.equipmentRepository.save(equipment);
  }

  async findAll(
    filters: EquipmentFilterDto,
    page = 1,
    perPage = 10,
  ): Promise<{
    equipment: Equipment[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: any = {};

    if (filters.portfolioId) {
      where.portfolioId = filters.portfolioId;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.condition) {
      where.condition = filters.condition;
    }

    if (filters.availability !== undefined) {
      where.availability = filters.availability;
    }

    if (filters.search) {
      where.name = Like(`%${filters.search}%`);
    }

    const [equipment, total] = await this.equipmentRepository.findAndCount({
      where,
      relations: ['portfolio'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      equipment,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
      relations: ['portfolio'],
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    return equipment;
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto): Promise<Equipment> {
    const equipment = await this.findById(id);
    Object.assign(equipment, updateEquipmentDto);
    return await this.equipmentRepository.save(equipment);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const equipment = await this.findById(id);
    
    // Désactiver l'équipement au lieu de le supprimer
    equipment.availability = false;
    await this.equipmentRepository.save(equipment);

    return {
      success: true,
      message: 'Equipment deactivated successfully',
    };
  }
}