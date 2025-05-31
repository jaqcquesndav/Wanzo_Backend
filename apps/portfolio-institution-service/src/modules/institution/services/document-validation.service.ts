import { Injectable } from '@nestjs/common';
import { InstitutionDocument } from '../entities/institution-document.entity';

@Injectable()
export class DocumentValidationService {
  validateDocument(document: InstitutionDocument): boolean {
    // Vérifier la validité du document
    if (!document.validUntil || document.validUntil < new Date()) {
      return false;
    }

    // Vérifier le format du document
    if (!document.cloudinaryUrl.startsWith('https://')) {
      return false;
    }

    // Vérifier la taille du document (simulé)
    const isValidSize = true;

    return isValidSize;
  }

  async scanDocument(document: InstitutionDocument): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Vérifier la validité de base
    if (!this.validateDocument(document)) {
      issues.push('Document validation failed');
    }

    // Vérifier la date d'expiration
    if (document.validUntil) {
      const daysUntilExpiry = Math.floor(
        (document.validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 30) {
        issues.push(`Document expires in ${daysUntilExpiry} days`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}