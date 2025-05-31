import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ListExpenseCategoriesDto } from './dto/list-expense-categories.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // Expense Categories
  @Post('categories')
  // Add role guard for admin/authorized users if needed
  createExpenseCategory(@Body() createExpenseCategoryDto: CreateExpenseCategoryDto) {
    return this.expensesService.createExpenseCategory(createExpenseCategoryDto);
  }

  @Get('categories')
  findAllExpenseCategories(@Query() listExpenseCategoriesDto: ListExpenseCategoriesDto) {
    return this.expensesService.findAllExpenseCategories(listExpenseCategoriesDto);
  }

  @Get('categories/:id')
  findOneExpenseCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.findOneExpenseCategory(id);
  }

  @Patch('categories/:id')
  // Add role guard for admin/authorized users if needed
  updateExpenseCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
  ) {
    return this.expensesService.updateExpenseCategory(id, updateExpenseCategoryDto);
  }

  @Delete('categories/:id')
  // Add role guard for admin/authorized users if needed
  removeExpenseCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.removeExpenseCategory(id);
  }

  // Expenses
  @Post()
  @UseInterceptors(FileInterceptor('attachment')) // 'attachment' is the field name for the file
  createExpense(
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
    attachment?: Express.Multer.File, // Make attachment optional
  ) {
    // TODO: Handle file upload to Cloudinary and add URL to createExpenseDto.attachmentUrl
    // if (attachment) {
    //   const attachmentUrl = await this.expensesService.handleExpenseAttachmentUpload(attachment);
    //   createExpenseDto.attachmentUrl = attachmentUrl; // Assuming DTO has attachmentUrl field
    // }
    return this.expensesService.createExpense(createExpenseDto, user.id);
  }

  @Get()
  findAllExpenses(@Query() listExpensesDto: ListExpensesDto, @CurrentUser() user: User) {
    return this.expensesService.findAllExpenses(listExpensesDto, user.id);
  }

  @Get(':id')
  findOneExpense(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.expensesService.findOneExpense(id, user.id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('attachment'))
  updateExpense(
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
    attachment?: Express.Multer.File,
  ) {
    // TODO: Handle file upload for update, potentially deleting old one
    // if (attachment) {
    //   const attachmentUrl = await this.expensesService.handleExpenseAttachmentUpload(attachment);
    //   updateExpenseDto.attachmentUrl = attachmentUrl;
    // }
    return this.expensesService.updateExpense(id, updateExpenseDto, user.id);
  }

  @Delete(':id')
  removeExpense(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    // TODO: Handle deletion of associated attachment from Cloudinary
    return this.expensesService.removeExpense(id, user.id);
  }
}
