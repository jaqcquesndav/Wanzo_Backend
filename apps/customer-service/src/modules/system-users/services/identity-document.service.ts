import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdentityDocument, IdentityDocumentType, VerificationStatus } from '../entities/identity-document.entity';
import { User } from '../entities/user.entity';
import {
  CreateIdentityDocumentDto,
  UpdateIdentityDocumentDto,
  IdentityDocumentResponseDto,
  VerifyDocumentDto
} from '../dto/user.dto';

@Injectable()
export class IdentityDocumentService {
  constructor(
    @InjectRepository(IdentityDocument)
    private readonly identityDocumentRepository: Repository<IdentityDocument>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Récupérer tous les documents d'identité d'un utilisateur
   */
  async getUserDocuments(userId: string): Promise<IdentityDocumentResponseDto[]> {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const documents = await this.identityDocumentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    return documents.map(doc => this.mapToDto(doc));
  }

  /**
   * Récupérer un document spécifique
   */
  async getDocumentById(userId: string, documentId: string): Promise<IdentityDocumentResponseDto> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId, userId }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.mapToDto(document);
  }

  /**
   * Uploader un nouveau document d'identité
   */
  async uploadDocument(
    userId: string,
    documentData: CreateIdentityDocumentDto,
    file: Express.Multer.File
  ): Promise<IdentityDocumentResponseDto> {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Valider le type de fichier
    this.validateFileType(file);

    // Vérifier qu'il n'y a pas déjà un document du même type vérifié
    const existingDocument = await this.identityDocumentRepository.findOne({
      where: {
        userId,
        type: documentData.documentType as IdentityDocumentType,
        status: VerificationStatus.VERIFIED
      }
    });

    if (existingDocument) {
      throw new BadRequestException(`A verified ${documentData.documentType} document already exists`);
    }

    // Simuler l'upload du fichier (dans un vrai projet, utiliser un service de stockage)
    const fileUrl = await this.uploadFileToStorage(file);

    // Créer le document
    const document = this.identityDocumentRepository.create({
      userId,
      type: documentData.documentType as IdentityDocumentType,
      number: documentData.documentNumber,
      issuingAuthority: documentData.issuingAuthority,
      issuedDate: new Date(documentData.issueDate),
      expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : undefined,
      documentUrl: fileUrl,
      status: VerificationStatus.PENDING,
      metadata: {
        uploadSource: 'web',
        originalFileName: file.originalname,
        uploadedAt: new Date().toISOString()
      } as any
    });

    const savedDocument = await this.identityDocumentRepository.save(document);

    // Déclencher la vérification automatique si possible
    await this.triggerAutoVerification(savedDocument);

    return this.mapToDto(savedDocument);
  }

  /**
   * Mettre à jour un document
   */
  async updateDocument(
    userId: string,
    documentId: string,
    updateData: UpdateIdentityDocumentDto
  ): Promise<IdentityDocumentResponseDto> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId, userId }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Empêcher la modification des documents déjà vérifiés
    if (document.status === VerificationStatus.VERIFIED) {
      throw new ForbiddenException('Cannot modify verified documents');
    }

    // Mettre à jour les champs autorisés
    if (updateData.documentNumber) {
      document.number = updateData.documentNumber;
    }
    if (updateData.issuingAuthority) {
      document.issuingAuthority = updateData.issuingAuthority;
    }
    if (updateData.issueDate) {
      document.issuedDate = new Date(updateData.issueDate);
    }
    if (updateData.expiryDate) {
      document.expiryDate = new Date(updateData.expiryDate);
    }

    // Réinitialiser le statut de vérification
    document.status = VerificationStatus.PENDING;
    document.verifiedAt = undefined;
    document.verifiedBy = undefined;
    document.rejectionReason = undefined;

    const updatedDocument = await this.identityDocumentRepository.save(document);

    // Déclencher la re-vérification
    await this.triggerAutoVerification(updatedDocument);

    return this.mapToDto(updatedDocument);
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId, userId }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Empêcher la suppression des documents vérifiés (selon les règles métier)
    if (document.status === VerificationStatus.VERIFIED) {
      throw new ForbiddenException('Cannot delete verified documents');
    }

    // Supprimer le fichier du stockage
    await this.deleteFileFromStorage(document.documentUrl || '');

    // Supprimer le document de la base de données
    await this.identityDocumentRepository.remove(document);
  }

  /**
   * Soumettre un document pour vérification manuelle
   */
  async submitForVerification(
    userId: string,
    documentId: string,
    verificationData: VerifyDocumentDto
  ): Promise<{ message: string; submittedAt: string }> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId, userId }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status === VerificationStatus.VERIFIED) {
      throw new BadRequestException('Document is already verified');
    }

    // Mettre à jour le statut (note: il n'y a pas de UNDER_REVIEW dans l'enum, donc on garde PENDING)
    document.status = VerificationStatus.PENDING;
    
    // Ajouter des métadonnées de soumission
    document.metadata = {
      ...document.metadata,
      submissionNotes: verificationData.notes,
      submittedAt: new Date().toISOString(),
      submissionType: 'manual'
    } as any;

    await this.identityDocumentRepository.save(document);

    // Notifier l'équipe de vérification (implémentation future)
    // await this.notifyVerificationTeam(document);

    return {
      message: 'Document submitted for verification successfully',
      submittedAt: new Date().toISOString()
    };
  }

  /**
   * Vérifier un document (utilisé par les administrateurs)
   */
  async verifyDocument(
    documentId: string,
    verifiedBy: string,
    status: VerificationStatus.VERIFIED | VerificationStatus.REJECTED,
    notes?: string
  ): Promise<IdentityDocumentResponseDto> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.status = status;
    document.verifiedBy = verifiedBy;
    document.verifiedAt = new Date();
    document.rejectionReason = status === VerificationStatus.REJECTED ? notes : undefined;

    // Ajouter des métadonnées de vérification
    document.metadata = {
      ...document.metadata,
      verificationMethod: 'manual',
      verifiedBy,
      verifiedAt: new Date().toISOString()
    } as any;

    const updatedDocument = await this.identityDocumentRepository.save(document);

    // Notifier l'utilisateur du résultat (implémentation future)
    // await this.notifyUserOfVerificationResult(document);

    return this.mapToDto(updatedDocument);
  }

  /**
   * Obtenir les statistiques de vérification d'un utilisateur
   */
  async getUserVerificationStats(userId: string): Promise<{
    totalDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
    rejectedDocuments: number;
    documentTypes: Record<string, {
      total: number;
      verified: number;
      pending: number;
      rejected: number;
    }>;
  }> {
    const documents = await this.getUserDocuments(userId);

    const stats = {
      totalDocuments: documents.length,
      verifiedDocuments: 0,
      pendingDocuments: 0,
      rejectedDocuments: 0,
      documentTypes: {} as any
    };

    // Initialiser les stats par type de document
    Object.values(IdentityDocumentType).forEach((type: string) => {
      stats.documentTypes[type] = {
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0
      };
    });

    // Calculer les statistiques
    documents.forEach(doc => {
      const typeStats = stats.documentTypes[doc.documentType];
      if (typeStats) {
        typeStats.total++;

        switch (doc.verificationStatus) {
          case VerificationStatus.VERIFIED:
            stats.verifiedDocuments++;
            typeStats.verified++;
            break;
          case VerificationStatus.REJECTED:
            stats.rejectedDocuments++;
            typeStats.rejected++;
            break;
          default:
            stats.pendingDocuments++;
            typeStats.pending++;
            break;
        }
      }
    });

    return stats;
  }

  /**
   * Récupérer les documents expirant bientôt
   */
  async getExpiringDocuments(userId: string, daysAhead: number = 30): Promise<IdentityDocumentResponseDto[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    const documents = await this.identityDocumentRepository.find({
      where: {
        userId,
        status: VerificationStatus.VERIFIED
      }
    });

    return documents
      .filter(doc => doc.expiryDate && doc.expiryDate <= cutoffDate)
      .map(doc => this.mapToDto(doc));
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Valider le type de fichier
   */
  private validateFileType(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
    }

    // Vérifier la taille du fichier (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 10MB.');
    }
  }

  /**
   * Simuler l'upload du fichier vers un service de stockage
   */
  private async uploadFileToStorage(file: Express.Multer.File): Promise<string> {
    // Dans un vrai projet, utiliser AWS S3, Google Cloud Storage, etc.
    const timestamp = Date.now();
    const filename = `identity-documents/${timestamp}-${file.originalname}`;
    
    // Simuler l'upload
    return `https://storage.example.com/${filename}`;
  }

  /**
   * Supprimer un fichier du stockage
   */
  private async deleteFileFromStorage(fileUrl: string): Promise<void> {
    // Dans un vrai projet, supprimer le fichier du service de stockage
    console.log(`Would delete file: ${fileUrl}`);
  }

  /**
   * Déclencher la vérification automatique
   */
  private async triggerAutoVerification(document: IdentityDocument): Promise<void> {
    // Implémentation future : OCR, validation automatique des documents
    // Pour l'instant, laisser en statut PENDING
    console.log(`Auto-verification triggered for document ${document.id}`);
  }

  /**
   * Mapper une entité IdentityDocument vers un DTO
   */
  private mapToDto(document: IdentityDocument): IdentityDocumentResponseDto {
    return {
      id: document.id,
      documentType: document.type,
      documentNumber: document.number,
      issuingCountry: 'N/A', // Pas disponible dans l'entité actuelle
      issuingAuthority: document.issuingAuthority || '',
      issueDate: document.issuedDate?.toISOString().split('T')[0] || '',
      expiryDate: document.expiryDate?.toISOString().split('T')[0],
      fileUrl: document.documentUrl || '',
      fileName: 'N/A', // Pas disponible dans l'entité actuelle
      fileSize: 0, // Pas disponible dans l'entité actuelle
      mimeType: 'N/A', // Pas disponible dans l'entité actuelle
      verificationStatus: document.status,
      verificationNotes: document.rejectionReason || '',
      verifiedBy: document.verifiedBy,
      verifiedAt: document.verifiedAt?.toISOString(),
      submittedForVerificationAt: undefined, // Pas disponible dans l'entité actuelle
      metadata: document.metadata,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
      isExpired: this.isDocumentExpired(document),
      daysUntilExpiry: this.getDaysUntilExpiry(document)
    };
  }

  /**
   * Vérifier si un document est expiré
   */
  private isDocumentExpired(document: IdentityDocument): boolean {
    if (!document.expiryDate) return false;
    return document.expiryDate < new Date();
  }

  /**
   * Calculer les jours jusqu'à expiration
   */
  private getDaysUntilExpiry(document: IdentityDocument): number | undefined {
    if (!document.expiryDate) return undefined;
    const today = new Date();
    const diffTime = document.expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}