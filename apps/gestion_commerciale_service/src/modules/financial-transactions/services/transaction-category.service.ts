import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, IsNull } from 'typeorm';
import { TransactionCategory } from '../entities/transaction-category.entity';
import { CreateTransactionCategoryDto, UpdateTransactionCategoryDto } from '../dtos/transaction-category.dto';

@Injectable()
export class TransactionCategoryService {
  private readonly logger = new Logger(TransactionCategoryService.name);

  constructor(
    @InjectRepository(TransactionCategory)
    private categoryRepository: Repository<TransactionCategory>,
  ) {}

  /**
   * Crée une nouvelle catégorie de transaction
   */
  async create(
    companyId: string, 
    createCategoryDto: CreateTransactionCategoryDto
  ): Promise<TransactionCategory> {
    this.logger.log(`Création d'une nouvelle catégorie de transaction pour la société ${companyId}`);
    
    // Vérifier si une catégorie avec le même nom existe déjà
    const existingCategory = await this.categoryRepository.findOne({
      where: { 
        companyId,
        name: createCategoryDto.name,
        parentId: createCategoryDto.parentId ? createCategoryDto.parentId : IsNull()
      }
    });

    if (existingCategory) {
      throw new ConflictException(`Une catégorie avec le nom '${createCategoryDto.name}' existe déjà dans ce niveau`);
    }

    // Vérifier que le parent existe s'il est spécifié
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId, companyId }
      });

      if (!parentCategory) {
        throw new NotFoundException(`La catégorie parent avec l'ID ${createCategoryDto.parentId} n'existe pas`);
      }
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      companyId
    });

    return await this.categoryRepository.save(category);
  }

  /**
   * Récupère toutes les catégories avec filtres et pagination optionnelle
   */
  async findAll(
    companyId: string, 
    {
      page = 1,
      limit = 100,
      parentId,
      searchTerm = '',
      includeInactive = false,
      transactionType,
      sortBy = 'name',
      sortOrder = 'ASC'
    }: {
      page?: number;
      limit?: number;
      parentId?: string | null;
      searchTerm?: string;
      includeInactive?: boolean;
      transactionType?: 'income' | 'expense' | 'both';
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ) {
    this.logger.log(`Récupération des catégories pour la société ${companyId}`);
    
    const skip = (page - 1) * limit;
    
    // Construire les conditions where
    const where: FindOptionsWhere<TransactionCategory> = { companyId };
    
    // Gérer les catégories racines ou les sous-catégories
    if (parentId === 'root') {
      where.parentId = IsNull();
    } else if (parentId) {
      where.parentId = parentId;
    }
    
    // Filtrer par terme de recherche si spécifié
    if (searchTerm) {
      where.name = Like(`%${searchTerm}%`);
    }
    
    // Filtrer par statut actif/inactif
    if (!includeInactive) {
      where.isActive = true;
    }
    
    // Filtrer par type de transaction si spécifié
    if (transactionType) {
      where.type = transactionType;
    }
    
    // Exécuter la requête
    const [categories, total] = await this.categoryRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
      relations: ['parent']
    });
    
    return {
      data: categories,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Construit une arborescence hiérarchique des catégories
   */
  async getCategoryTree(companyId: string, includeInactive = false): Promise<TransactionCategory[]> {
    this.logger.log(`Construction de l'arborescence des catégories pour la société ${companyId}`);
    
    // Récupérer toutes les catégories
    const allCategories = await this.categoryRepository.find({
      where: {
        companyId,
        isActive: includeInactive ? undefined : true
      },
      order: { name: 'ASC' }
    });
    
    // Définir un type pour les catégories avec enfants
    interface CategoryWithChildren extends TransactionCategory {
      children: CategoryWithChildren[];
    }
    
    // Mapper les catégories par ID pour un accès facile
    const categoriesById = new Map<string, CategoryWithChildren>();
    
    allCategories.forEach(category => {
      categoriesById.set(category.id, {...category, children: []} as CategoryWithChildren);
    });
    
    // Construire l'arborescence
    const rootCategories: CategoryWithChildren[] = [];
    
    allCategories.forEach(category => {
      const categoryWithChildren = categoriesById.get(category.id);
      
      if (category.parentId) {
        const parent = categoriesById.get(category.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren!);
        }
      } else {
        rootCategories.push(categoryWithChildren!);
      }
    });
    
    return rootCategories;
  }

  /**
   * Récupère une catégorie par son ID
   */
  async findOne(companyId: string, id: string): Promise<TransactionCategory> {
    this.logger.log(`Récupération de la catégorie ${id} pour la société ${companyId}`);
    
    const category = await this.categoryRepository.findOne({
      where: { id, companyId },
      relations: ['parent']
    });
    
    if (!category) {
      throw new NotFoundException(`Catégorie avec l'ID ${id} non trouvée`);
    }
    
    return category;
  }

  /**
   * Met à jour une catégorie existante
   */
  async update(
    companyId: string, 
    id: string, 
    updateCategoryDto: UpdateTransactionCategoryDto
  ): Promise<TransactionCategory> {
    this.logger.log(`Mise à jour de la catégorie ${id} pour la société ${companyId}`);
    
    const category = await this.findOne(companyId, id);
    
    // Vérifier que le nouveau nom n'entre pas en conflit avec une autre catégorie
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const parentIdToCheck = updateCategoryDto.parentId || category.parentId;
      
      const existingCategory = await this.categoryRepository
        .createQueryBuilder('category')
        .where('category.companyId = :companyId', { companyId })
        .andWhere('category.name = :name', { name: updateCategoryDto.name })
        .andWhere('category.id != :id', { id })
        .andWhere(
          parentIdToCheck 
            ? 'category.parentId = :parentId' 
            : 'category.parentId IS NULL', 
          parentIdToCheck ? { parentId: parentIdToCheck } : {}
        )
        .getOne();

      if (existingCategory) {
        throw new ConflictException(`Une catégorie avec le nom '${updateCategoryDto.name}' existe déjà dans ce niveau`);
      }
    }

    // Vérifier que le nouveau parent existe s'il est spécifié
    if (updateCategoryDto.parentId && updateCategoryDto.parentId !== category.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId, companyId }
      });

      if (!parentCategory) {
        throw new NotFoundException(`La catégorie parent avec l'ID ${updateCategoryDto.parentId} n'existe pas`);
      }
      
      // Vérifier que le nouveau parent n'est pas un descendant de cette catégorie
      if (await this.isDescendantOf(updateCategoryDto.parentId, id, companyId)) {
        throw new ConflictException(`Boucle de hiérarchie détectée: une catégorie ne peut pas être son propre parent`);
      }
    }

    // Mettre à jour les propriétés
    Object.assign(category, updateCategoryDto);
    
    return await this.categoryRepository.save(category);
  }

  /**
   * Supprime une catégorie
   */
  async remove(companyId: string, id: string): Promise<void> {
    this.logger.log(`Suppression de la catégorie ${id} pour la société ${companyId}`);
    
    const category = await this.findOne(companyId, id);
    
    // Vérifier s'il y a des sous-catégories
    const hasChildren = await this.categoryRepository.findOne({
      where: { parentId: id, companyId }
    });
    
    if (hasChildren) {
      throw new ConflictException(`Impossible de supprimer la catégorie car elle contient des sous-catégories`);
    }
    
    // Vérifier si la catégorie est utilisée par des transactions
    // Cette vérification doit être implémentée en fonction du modèle de relation
    // entre les transactions et les catégories
    
    await this.categoryRepository.remove(category);
  }
  
  /**
   * Vérifie si une catégorie est un descendant d'une autre catégorie
   * Cette fonction est utilisée pour éviter les boucles dans la hiérarchie
   */
  private async isDescendantOf(
    potentialDescendantId: string, 
    ancestorId: string, 
    companyId: string
  ): Promise<boolean> {
    // Si les IDs sont identiques, c'est une boucle évidente
    if (potentialDescendantId === ancestorId) {
      return true;
    }
    
    const potentialDescendant = await this.categoryRepository.findOne({
      where: { id: potentialDescendantId, companyId }
    });
    
    // Si la catégorie n'existe pas ou n'a pas de parent, ce n'est pas un descendant
    if (!potentialDescendant || !potentialDescendant.parentId) {
      return false;
    }
    
    // Si le parent est l'ancêtre recherché, c'est un descendant
    if (potentialDescendant.parentId === ancestorId) {
      return true;
    }
    
    // Vérifier récursivement avec le parent
    return this.isDescendantOf(potentialDescendant.parentId, ancestorId, companyId);
  }
}
