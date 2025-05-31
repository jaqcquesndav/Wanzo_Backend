import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, UsePipes, Query } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity'; // Assuming User entity is needed for company context

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createSupplierDto: CreateSupplierDto, @CurrentUser() user: User) {
    // Assuming companyId is part of the user object or can be derived
    if (!user.companyId) {
      throw new Error('User is not associated with a company.'); // Or handle more gracefully
    }
    return this.suppliersService.create(createSupplierDto, user.companyId);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.');
    }
    return this.suppliersService.findAll(user.companyId, { page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.');
    }
    return this.suppliersService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto, @CurrentUser() user: User) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.');
    }
    return this.suppliersService.update(id, updateSupplierDto, user.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.');
    }
    return this.suppliersService.remove(id, user.companyId);
  }
}
