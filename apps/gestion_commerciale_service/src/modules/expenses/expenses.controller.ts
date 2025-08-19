import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
  Req,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { Expense, ExpenseCategoryType } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ListExpenseCategoriesDto } from './dto/list-expense-categories.dto';

@ApiTags('dépenses')
@ApiBearerAuth('JWT-auth')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}
  // Expense Categories
  @Post('categories')
  // Add role guard for admin/authorized users if needed
  @ApiOperation({ 
    summary: 'Créer une catégorie de dépense', 
    description: 'Crée une nouvelle catégorie de dépense'
  })
  @ApiBody({ 
    type: CreateExpenseCategoryDto,
    description: 'Données de la catégorie à créer'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Catégorie créée avec succès',
    type: ExpenseCategory
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  createExpenseCategory(@Body() createExpenseCategoryDto: CreateExpenseCategoryDto) {
    return this.expensesService.createExpenseCategory(createExpenseCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ 
    summary: 'Récupérer toutes les catégories de dépense', 
    description: 'Récupère la liste de toutes les catégories de dépense avec pagination'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des catégories récupérée avec succès',
    type: [ExpenseCategory]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findAllExpenseCategories(@Query() listExpenseCategoriesDto: ListExpenseCategoriesDto) {
    return this.expensesService.findAllExpenseCategories(listExpenseCategoriesDto);
  }
  @Get('categories/:id')
  @ApiOperation({ 
    summary: 'Récupérer une catégorie de dépense spécifique', 
    description: 'Récupère une catégorie de dépense par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la catégorie', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Catégorie récupérée avec succès',
    type: ExpenseCategory
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Catégorie non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findOneExpenseCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.findOneExpenseCategory(id);
  }

  @Patch('categories/:id')
  // Add role guard for admin/authorized users if needed
  @ApiOperation({ 
    summary: 'Mettre à jour une catégorie de dépense', 
    description: 'Met à jour les informations d\'une catégorie de dépense existante'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la catégorie', 
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ 
    type: UpdateExpenseCategoryDto,
    description: 'Données de la catégorie à mettre à jour'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Catégorie mise à jour avec succès',
    type: ExpenseCategory
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Catégorie non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  updateExpenseCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
  ) {
    return this.expensesService.updateExpenseCategory(id, updateExpenseCategoryDto);
  }
  @Delete('categories/:id')
  // Add role guard for admin/authorized users if needed
  @ApiOperation({ 
    summary: 'Supprimer une catégorie de dépense', 
    description: 'Supprime une catégorie de dépense par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la catégorie', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Catégorie supprimée avec succès'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Catégorie non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflit - La catégorie est utilisée par des dépenses existantes'
  })
  removeExpenseCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.removeExpenseCategory(id);
  }

  // Expenses
  @Post()
  @UseInterceptors(FileInterceptor('attachment')) // 'attachment' is the field name for the file
  @ApiOperation({ 
    summary: 'Créer une dépense', 
    description: 'Crée une nouvelle dépense avec pièce jointe optionnelle'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    type: CreateExpenseDto,
    description: 'Données de la dépense à créer'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Dépense créée avec succès',
    type: Expense
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })  createExpense(
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          // new FileTypeValidator({ fileType: 'image/jpeg|image/png|application/pdf' }),
        ],
        fileIsRequired: false, // Set to true if attachment is mandatory
      }),
    )
    attachment?: any, // Make attachment optional
  ) {
    // TODO: Handle file upload to Cloudinary and add URL to createExpenseDto.attachmentUrl
    // if (attachment) {
    //   const attachmentUrl = await this.expensesService.handleExpenseAttachmentUpload(attachment);
    //   createExpenseDto.attachmentUrl = attachmentUrl; // Assuming DTO has attachmentUrl field
    // }
    return this.expensesService.createExpense(createExpenseDto, user.id);
  }
  @Get()
  @ApiOperation({ 
    summary: 'Récupérer toutes les dépenses', 
    description: 'Récupère la liste de toutes les dépenses avec pagination'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des dépenses récupérée avec succès',
    type: ExpenseResponseDto,
    isArray: true
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })  async findAllExpenses(@Query() listExpensesDto: ListExpensesDto, @CurrentUser() user: User) {
    const result = await this.expensesService.findAllExpenses(listExpensesDto, user.id);
    
    // Transformer les entités en DTO pour le format attendu par le frontend
    const transformedData = result.data.map(expense => 
      ExpenseResponseDto.fromEntity(expense, expense.category)
    );
    
    return {
      success: true,
      message: 'Liste des dépenses récupérée avec succès',
      data: transformedData,
      total: result.total,
      page: result.page,
      limit: result.limit,
      statusCode: 200
    };
  }@Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer une dépense spécifique', 
    description: 'Récupère une dépense par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la dépense', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dépense récupérée avec succès',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Dépense récupérée avec succès' },
        data: { $ref: '#/components/schemas/ExpenseResponseDto' },
        statusCode: { type: 'number', example: 200 }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Dépense non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })  async findOneExpense(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const expense = await this.expensesService.findOneExpense(id, user.id);
    const responseDto = ExpenseResponseDto.fromEntity(expense, expense.category);
    
    return {
      success: true,
      message: 'Dépense récupérée avec succès',
      data: responseDto,
      statusCode: 200
    };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiOperation({ 
    summary: 'Mettre à jour une dépense', 
    description: 'Met à jour les informations d\'une dépense existante avec pièce jointe optionnelle'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la dépense', 
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ 
    type: UpdateExpenseDto,
    description: 'Données de la dépense à mettre à jour'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dépense mise à jour avec succès',
    type: Expense
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Dépense non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })  updateExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
            // new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
            // new FileTypeValidator({ fileType: 'image/jpeg|image/png|application/pdf' }),
        ],
        fileIsRequired: false,
      }),
    )
    attachment?: any,
  ) {
    // TODO: Handle file upload for update, potentially deleting old one
    // if (attachment) {
    //   const attachmentUrl = await this.expensesService.handleExpenseAttachmentUpload(attachment);
    //   updateExpenseDto.attachmentUrl = attachmentUrl;
    // }
    return this.expensesService.updateExpense(id, updateExpenseDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer une dépense', 
    description: 'Supprime une dépense par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la dépense', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dépense supprimée avec succès'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Dépense non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  removeExpense(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    // TODO: Handle deletion of associated attachment from Cloudinary
    return this.expensesService.removeExpense(id, user.id);
  }
}
