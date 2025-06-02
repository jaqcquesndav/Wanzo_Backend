import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, ParseUUIDPipe, ValidationPipe, UsePipes } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming JWT guard for company routes
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('company')
@UseGuards(JwtAuthGuard) // Secure all company routes
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // This endpoint might be more for admin or specific scenarios.
  // Typically, company creation is part of user registration.
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createCompanyDto: CreateCompanyDto, @CurrentUser() user: User) {
    // Potentially add logic here to associate company with the user if not handled by AuthService
    // Or restrict who can create companies.
    // For now, let's assume CompanyService handles DTO and creation.
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    // Add filtering/pagination as needed
    return this.companyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.findOne(id);
  }

  // Endpoint for a user to get their own company details
  @Get('my-company')
  async findMyCompany(@CurrentUser() user: User) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.'); // Or handle as per your logic
    }
    return this.companyService.findOne(user.companyId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: User // Ensure user is authorized to update this company
  ) {
    // Add authorization logic: e.g., user can only update their own company
    if (user.companyId !== id) {
        throw new Error('Unauthorized to update this company'); // Replace with ForbiddenException
    }
    return this.companyService.update(id, updateCompanyDto);
  }

  // Deletion might be restricted to admins or specific conditions
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    // Add authorization logic here
    if (user.companyId !== id /* and user is not admin */) {
        throw new Error('Unauthorized to delete this company'); // Replace with ForbiddenException
    }
    return this.companyService.remove(id);
  }
}
