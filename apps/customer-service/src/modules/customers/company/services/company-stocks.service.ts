import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyCoreEntity as Company } from '../entities/company-core.entity';
import { 
  CreateStockDto as CreateCompanyStockDto, 
  UpdateStockDto as UpdateCompanyStockDto, 
  StockResponseDto,
  StockDataDto,
  StockMovementDto,
  StockCategory,
  StockState
} from '../dto/company-stocks.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion des stocks des entreprises
 * Gère l'inventaire, les mouvements et les statistiques de stock
 */
@Injectable()
export class CompanyStocksService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Ajouter un nouveau stock à une entreprise
   */
  async addStock(companyId: string, createStockDto: CreateCompanyStockDto): Promise<StockResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Validation des données obligatoires
      this.validateStockData(createStockDto.stock);

      // Vérification de l'unicité du SKU
      await this.checkSkuUniqueness(company, createStockDto.stock.designation);

      // Création du nouveau stock avec ID unique
      const stockId = crypto.randomUUID();
      const currentDate = new Date().toISOString();
      
      const newStock = {
        id: stockId,
        ...createStockDto.stock,
        movements: [] as any[],
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      // Création du mouvement initial si une quantité est fournie
      if (createStockDto.stock.quantiteStock > 0) {
        const initialMovement = {
          type: 'entree',
          quantite: createStockDto.stock.quantiteStock,
          reference: 'STOCK_INITIAL',
          date: currentDate,
          coutUnitaire: createStockDto.stock.coutUnitaire,
          coutTotal: (createStockDto.stock.coutUnitaire || 0) * createStockDto.stock.quantiteStock,
          monnaie: createStockDto.stock.devise,
        };
        newStock.movements = [initialMovement];
      }

      // Ajout du stock à l'entreprise
      if (!company.stockData) {
        company.stockData = [];
      }
      company.stockData.push(newStock);

      await this.companyRepository.save(company);
      
      return this.mapToStockResponseDto(newStock);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout du stock: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour un stock existant
   */
  async updateStock(companyId: string, updateStockDto: UpdateCompanyStockDto): Promise<StockResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        throw new Error('Entreprise ou données de stock non trouvées');
      }

      const stockIndex = company.stockData.findIndex(stock => stock.id === updateStockDto.stockId);
      
      if (stockIndex === -1) {
        throw new Error('Stock non trouvé');
      }

      // Vérification de l'unicité du SKU si modifié
      if (updateStockDto.stock.designation &&
          updateStockDto.stock.designation !== company.stockData[stockIndex].designation) {
        await this.checkSkuUniqueness(company, updateStockDto.stock.designation, updateStockDto.stockId);
      }

      // Mise à jour des données
      const updatedStock = {
        ...company.stockData[stockIndex],
        ...updateStockDto.stock,
        updatedAt: new Date().toISOString(),
      };

      company.stockData[stockIndex] = updatedStock;
      await this.companyRepository.save(company);
      
      return this.mapToStockResponseDto(updatedStock);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour du stock: ${errorMessage}`);
    }
  }

  /**
   * Récupérer tous les stocks d'une entreprise
   */
  async getStocks(companyId: string, page = 1, limit = 10): Promise<{ stocks: StockResponseDto[], total: number }> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      const stocks = company.stockData || [];
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStocks = stocks.slice(startIndex, endIndex);

      return {
        stocks: paginatedStocks.map(stock => this.mapToStockResponseDto(stock)),
        total: stocks.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des stocks: ${errorMessage}`);
    }
  }

  /**
   * Récupérer un stock par ID
   */
  async getStockById(companyId: string, stockId: string): Promise<StockResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        throw new Error('Entreprise ou données de stock non trouvées');
      }

      const stock = company.stockData.find(s => s.id === stockId);
      
      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      return this.mapToStockResponseDto(stock);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération du stock: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les stocks par catégorie
   */
  async getStocksByCategory(companyId: string, category: StockCategory): Promise<StockResponseDto[]> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        throw new Error('Entreprise ou données de stock non trouvées');
      }

      const stocks = company.stockData.filter(stock => stock.categorie === category);
      
      return stocks.map(stock => this.mapToStockResponseDto(stock));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des stocks par catégorie: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les stocks en faible quantité
   */
  async getLowStocks(companyId: string, threshold = 10): Promise<StockResponseDto[]> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        throw new Error('Entreprise ou données de stock non trouvées');
      }

      const lowStocks = company.stockData.filter(stock => stock.quantiteStock <= threshold);
      
      return lowStocks.map(stock => this.mapToStockResponseDto(stock));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des stocks en faible quantité: ${errorMessage}`);
    }
  }

  /**
   * Effectuer une entrée de stock
   */
  async stockEntry(companyId: string, stockId: string, movement: Omit<StockMovementDto, 'type' | 'id'>): Promise<StockResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        throw new Error('Entreprise ou données de stock non trouvées');
      }

      const stock = company.stockData.find(s => s.id === stockId);
      
      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      // Création du mouvement d'entrée
      const entryMovement = {
        type: 'entree',
        ...movement,
      };

      // Mise à jour de la quantité
      stock.quantiteStock += movement.quantite;

      // Mise à jour du prix moyen pondéré si un nouveau coût unitaire est fourni
      if (stock.quantiteStock > 0) {
        // Recalcul automatique du coût unitaire moyen
        const oldTotalValue = stock.quantiteStock * stock.coutUnitaire;
        const newTotalValue = movement.quantite * stock.coutUnitaire;
        stock.coutUnitaire = (oldTotalValue + newTotalValue) / (stock.quantiteStock + movement.quantite);
      }

      // Ajout du mouvement à l'historique
      if (!stock.movements) {
        stock.movements = [];
      }
      stock.movements.push(entryMovement);
      stock.updatedAt = new Date().toISOString();

      await this.companyRepository.save(company);
      
      return this.mapToStockResponseDto(stock);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'entrée de stock: ${errorMessage}`);
    }
  }

  /**
   * Effectuer une sortie de stock
   */
  async stockExit(companyId: string, stockId: string, movement: Omit<StockMovementDto, 'type' | 'id'>): Promise<StockResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        throw new Error('Entreprise ou données de stock non trouvées');
      }

      const stock = company.stockData.find(s => s.id === stockId);
      
      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      // Vérification de la quantité disponible
      if (stock.quantiteStock < movement.quantite) {
        throw new Error(`Quantité insuffisante. Disponible: ${stock.quantiteStock}, Demandé: ${movement.quantite}`);
      }

      // Création du mouvement de sortie
      const exitMovement = {
        type: 'sortie',
        ...movement,
        coutUnitaire: (movement as any).coutUnitaire || stock.prixUnitaire,
        coutTotal: ((movement as any).coutUnitaire || stock.prixUnitaire || 0) * movement.quantite,
      };

      // Mise à jour de la quantité
      stock.quantiteStock -= movement.quantite;

      // Ajout du mouvement à l'historique
      if (!stock.movements) {
        stock.movements = [];
      }
      stock.movements.push(exitMovement);
      stock.updatedAt = new Date().toISOString();

      await this.companyRepository.save(company);
      
      return this.mapToStockResponseDto(stock);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la sortie de stock: ${errorMessage}`);
    }
  }

  /**
   * Effectuer un ajustement de stock
   */
  async stockAdjustment(companyId: string, stockId: string, newQuantity: number, reason: string): Promise<StockResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        throw new Error('Entreprise ou données de stock non trouvées');
      }

      const stock = company.stockData.find(s => s.id === stockId);
      
      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      const oldQuantity = stock.quantiteStock;
      const difference = newQuantity - oldQuantity;

      // Création du mouvement d'ajustement
      const adjustmentMovement = {
        type: 'ajustement',
        quantite: Math.abs(difference),
        reference: reason,
        date: new Date().toISOString(),
        coutUnitaire: stock.prixUnitaire,
        coutTotal: (stock.prixUnitaire || 0) * Math.abs(difference),
        monnaie: stock.monnaie,
        motif: reason,
        ancienneQuantite: oldQuantity,
        nouvelleQuantite: newQuantity,
      };

      // Mise à jour de la quantité
      stock.quantiteStock = newQuantity;

      // Ajout du mouvement à l'historique
      if (!stock.movements) {
        stock.movements = [];
      }
      stock.movements.push(adjustmentMovement);
      stock.updatedAt = new Date().toISOString();

      await this.companyRepository.save(company);
      
      return this.mapToStockResponseDto(stock);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajustement du stock: ${errorMessage}`);
    }
  }

  /**
   * Calculer la valeur totale du stock
   */
  async calculateTotalStockValue(companyId: string): Promise<{ totalValue: number, currency: string }> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        return { totalValue: 0, currency: 'USD' };
      }

      let totalValue = 0;
      let currency = 'USD';

      for (const stock of company.stockData) {
        const stockValue = stock.quantiteStock * (stock.prixUnitaire || 0);
        totalValue += stockValue;
        if (stock.monnaie) {
          currency = stock.monnaie;
        }
      }

      return { totalValue, currency };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors du calcul de la valeur totale du stock: ${errorMessage}`);
    }
  }

  /**
   * Générer des statistiques de stock
   */
  async generateStockStatistics(companyId: string): Promise<{
    totalItems: number;
    totalValue: number;
    currency: string;
    categoryBreakdown: Record<string, number>;
    stateBreakdown: Record<string, number>;
    lowStockItems: number;
    totalMovements: number;
    averageValue: number;
  }> {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      
      if (!company || !company.stockData) {
        return {
          totalItems: 0,
          totalValue: 0,
          currency: 'USD',
          categoryBreakdown: {},
          stateBreakdown: {},
          lowStockItems: 0,
          totalMovements: 0,
          averageValue: 0,
        };
      }

      const stocks = company.stockData;
      const totalItems = stocks.length;
      let totalValue = 0;
      const categoryBreakdown: { [key: string]: number } = {};
      const stateBreakdown: { [key: string]: number } = {};
      let lowStockItems = 0;
      let totalMovements = 0;
      let currency = 'USD';

      for (const stock of stocks) {
        // Valeur totale
        const stockValue = stock.quantiteStock * (stock.prixUnitaire || 0);
        totalValue += stockValue;

        // Devise
        if (stock.monnaie) {
          currency = stock.monnaie;
        }

        // Répartition par catégorie
        const category = stock.categorie || 'autre';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;

        // Répartition par état
        const state = stock.etat || 'bon';
        stateBreakdown[state] = (stateBreakdown[state] || 0) + 1;

        // Articles en faible stock (seuil par défaut: 10)
        if (stock.quantiteStock <= (stock.seuilAlerte || 10)) {
          lowStockItems++;
        }

        // Total des mouvements
        totalMovements += stock.movements ? stock.movements.length : 0;
      }

      const averageValue = totalItems > 0 ? totalValue / totalItems : 0;

      return {
        totalItems,
        totalValue,
        currency,
        categoryBreakdown,
        stateBreakdown,
        lowStockItems,
        totalMovements,
        averageValue,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des statistiques: ${errorMessage}`);
    }
  }

  // Méthodes privées

  /**
   * Vérifier l'unicité de la désignation du stock
   */
  private async checkSkuUniqueness(company: Company, designation: string, excludeStockId?: string): Promise<void> {
    if (!company.stockData) {
      return;
    }

    const existingStock = company.stockData.find(stock => 
      stock.designation === designation && stock.id !== excludeStockId
    );

    if (existingStock) {
      throw new Error(`Un stock avec la désignation "${designation}" existe déjà`);
    }
  }

  /**
   * Valider les données de stock obligatoires
   */
  private validateStockData(stock: StockDataDto): void {
    if (!stock.designation) {
      throw new Error('La désignation du stock est requise');
    }
    if (!stock.categorie) {
      throw new Error('La catégorie du stock est requise');
    }
    if (stock.quantiteStock < 0) {
      throw new Error('La quantité ne peut pas être négative');
    }
    if (stock.coutUnitaire && stock.coutUnitaire <= 0) {
      throw new Error('Le coût unitaire doit être positif');
    }
  }

  /**
   * Mapper les données de stock vers le DTO de réponse
   */
  private mapToStockResponseDto(stock: any): StockResponseDto {
    return {
      id: stock.id,
      designation: stock.designation,
      description: stock.description,
      categorie: stock.categorie,
      quantiteStock: stock.quantiteStock,
      coutUnitaire: stock.coutUnitaire,
      // seuilAlerte non disponible
      // seuilOptimal non disponible
      unite: stock.unite,
      devise: stock.devise,
      // fournisseur non disponible
      // emplacement non disponible
      // codeInterne non disponible
      // codeBarre non disponible
      // dateExpiration, numeroLot, etat, poids, dimensions, couleur, marque, modele, garantie, observations, movements non disponibles
      valeurTotaleStock: stock.quantiteStock * stock.coutUnitaire || 0,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    };
  }

  /**
   * Enregistrer un mouvement de stock (générique: entrée ou sortie)
   */
  async recordMovement(companyId: string, stockId: string, movement: Omit<StockMovementDto, 'id'> & { type: 'in' | 'out' | 'entree' | 'sortie' | 'adjustment' }): Promise<StockResponseDto> {
    // Normaliser le type de mouvement
    const normalizedType = movement.type === 'in' || movement.type === 'entree' ? 'entree' : 'sortie';
    
    // Créer un mouvement compatible avec StockMovementDto
    const movementData: Omit<StockMovementDto, 'id' | 'typeMouvement'> = {
      stockId: movement.stockId,
      quantite: movement.quantite,
      motif: movement.motif,
      referenceDocument: movement.referenceDocument,
      responsable: movement.responsable,
      // date moved to createdAt
    };

    if (normalizedType === 'entree') {
      return this.stockEntry(companyId, stockId, movementData as any);
    } else {
      return this.stockExit(companyId, stockId, movementData as any);
    }
  }
}