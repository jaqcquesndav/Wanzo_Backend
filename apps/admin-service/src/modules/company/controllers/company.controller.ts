import { Controller, Get, Put, Body, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from '../services';
import { 
  CompanyProfileResponseDto,
  UpdateCompanyProfileDto, 
  CompanyUpdateResponseDto 
} from '../dtos';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Get company profile
   */
  @Get('profile')
  async getCompanyProfile(): Promise<CompanyProfileResponseDto> {
    const data = await this.companyService.getCompanyProfile();
    return { data };
  }

  /**
   * Update company profile
   */
  @Put('profile')
  async updateCompanyProfile(
    @Body() updateDto: UpdateCompanyProfileDto
  ): Promise<CompanyUpdateResponseDto> {
    const data = await this.companyService.updateCompanyProfile(updateDto);
    return {
      data,
      message: 'Company profile updated successfully'
    };
  }

  /**
   * Upload company logo
   */
  @Post('logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ logoUrl: string; message: string }> {
    const result = await this.companyService.uploadLogo(
      file.buffer,
      file.originalname
    );
    return {
      ...result,
      message: 'Logo uploaded successfully'
    };
  }
}
