import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CentraleRisqueApiService {
  private apiBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiBaseUrl = this.configService.get<string>('CENTRALE_RISQUE_API_URL', 'https://api.centrale-risque.example.com');
  }

  async getCompanyRisks(companyId: string) {
    const url = `${this.apiBaseUrl}/companies/${companyId}/risks`;
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }

  async getCompanyPaymentIncidents(companyId: string) {
    const url = `${this.apiBaseUrl}/companies/${companyId}/payment-incidents`;
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }

  async getCompanyCreditScore(companyId: string) {
    const url = `${this.apiBaseUrl}/companies/${companyId}/credit-score`;
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }

  async getCompanyLoans(companyId: string) {
    const url = `${this.apiBaseUrl}/companies/${companyId}/loans`;
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }

  async getCompanyCollaterals(companyId: string) {
    const url = `${this.apiBaseUrl}/companies/${companyId}/collaterals`;
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }
}
