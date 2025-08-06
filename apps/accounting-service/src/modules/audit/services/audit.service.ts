import { Injectable } from '@nestjs/common';
import { FiscalYearsService } from '../../fiscal-years/services/fiscal-year.service';

@Injectable()
export class AuditService {
  constructor(private fiscalYearsService: FiscalYearsService) {}
  
  private auditTokens: Map<string, { 
    token: string, 
    expiresAt: Date, 
    name: string, 
    registrationNumber: string,
    companyId: string
  }> = new Map();

  async requestToken(
    name: string, 
    registrationNumber: string, 
    companyId: string
  ): Promise<{ expiresAt: Date }> {
    // Generate a 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Store the token
    this.auditTokens.set(token, {
      token,
      expiresAt,
      name,
      registrationNumber,
      companyId
    });
    
    // In a real application, send the token to the auditor via email/SMS
    // For this implementation, we'll just return the expiration time
    return { expiresAt };
  }
  
  async validateToken(
    token: string
  ): Promise<{ 
    valid: boolean, 
    auditor?: { name: string, registrationNumber: string }, 
    companyId?: string 
  }> {
    // Get the token data
    const tokenData = this.auditTokens.get(token);
    
    // Check if token exists and is not expired
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return { valid: false };
    }
    
    // Return the auditor information
    return {
      valid: true,
      auditor: {
        name: tokenData.name,
        registrationNumber: tokenData.registrationNumber
      },
      companyId: tokenData.companyId
    };
  }
  
  async setAuditStatus(
    fiscalYearId: string, 
    companyId: string, 
    auditorInfo: { name: string, registrationNumber: string }
  ) {
    return this.fiscalYearsService.setAuditStatus(fiscalYearId, companyId, auditorInfo);
  }
}
