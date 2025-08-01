import { ApiProperty } from '@nestjs/swagger';
import { Expense, ExpenseCategoryType } from '../entities/expense.entity';
import { ExpenseCategory } from '../entities/expense-category.entity';
import { ExpenseCategoryEnum, CATEGORY_NAME_TO_ENUM_MAP } from '../enums/expense-category.enum';

/**
 * DTO pour la réponse d'une dépense, formatée selon les attentes du frontend.
 * Convertit les catégories personnalisées en enums standards.
 */
export class ExpenseResponseDto {
  @ApiProperty({ 
    description: 'Identifiant unique de la dépense',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' 
  })
  id: string;

  @ApiProperty({ 
    description: 'Date de la dépense', 
    example: '2025-06-04T12:00:00Z' 
  })
  date: string;

  @ApiProperty({ 
    description: 'Montant de la dépense', 
    example: 250.50 
  })
  amount: number;

  @ApiProperty({ 
    description: 'Motif de la dépense', 
    example: 'Achat de fournitures de bureau' 
  })
  motif: string;

  @ApiProperty({ 
    description: 'Catégorie de la dépense (enum)', 
    example: 'supplies',
    enum: ExpenseCategoryEnum
  })
  category: ExpenseCategoryEnum;

  @ApiProperty({ 
    description: 'Méthode de paiement utilisée', 
    example: 'cash' 
  })
  paymentMethod: string;

  @ApiProperty({ 
    description: 'URLs des pièces jointes', 
    example: ['https://example.com/attachments/receipt.pdf'],
    type: [String] 
  })
  attachmentUrls: string[];

  @ApiProperty({ 
    description: 'ID du fournisseur associé (optionnel)', 
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    required: false 
  })
  supplierId?: string;

  @ApiProperty({ 
    description: 'Date de création', 
    example: '2025-06-04T12:00:00Z' 
  })
  createdAt: string;

  @ApiProperty({ 
    description: 'Date de dernière mise à jour', 
    example: '2025-06-04T12:00:00Z' 
  })
  updatedAt: string;

  /**
   * Convertit une entité Expense en ExpenseResponseDto
   * Accepte soit un ExpenseCategoryType (enum) ou une entité ExpenseCategory
   */
  static fromEntity(expense: Expense, category: ExpenseCategoryType | ExpenseCategory): ExpenseResponseDto {
    const dto = new ExpenseResponseDto();
    dto.id = expense.id;
    dto.date = expense.date.toISOString();
    dto.amount = expense.amount;
    dto.motif = expense.motif;
    
    // Déterminer le nom de la catégorie selon le type passé
    let categoryName: string;
    if (typeof category === 'string') {
      // Si c'est une valeur enum
      categoryName = category;
    } else if (typeof category === 'object' && category.name) {
      // Si c'est une entité ExpenseCategory
      categoryName = category.name;
    } else {
      categoryName = ExpenseCategoryType.OTHER;
    }
    
    // Mapper la catégorie personnalisée vers l'enum attendu par le frontend
    dto.category = mapCategoryToEnum(categoryName);
    dto.paymentMethod = expense.paymentMethod;
    dto.attachmentUrls = expense.attachmentUrls || [];
    dto.supplierId = expense.supplierId;
    dto.createdAt = expense.createdAt.toISOString();
    dto.updatedAt = expense.updatedAt.toISOString();
    return dto;
  }
}

/**
 * Fonction auxiliaire pour mapper les noms de catégories personnalisées
 * vers les valeurs d'enum ExpenseCategoryEnum.
 */
function mapCategoryToEnum(categoryName: string): ExpenseCategoryEnum {
  // Use the mapping object from the enum file, which provides type safety
  return CATEGORY_NAME_TO_ENUM_MAP[categoryName as keyof typeof CATEGORY_NAME_TO_ENUM_MAP] || ExpenseCategoryEnum.OTHER;
}
