import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus } from '../../entities/customer.entity';
import { CustomerEventsProducer } from '../../../kafka/producers/customer-events.producer';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { FileUploadResponseDto } from '../dto';

/**
 * Interface pour les fichiers uploadés (MulterFile)
 */
export interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname?: string;
}

/**
 * Service de base abstrait pour les clients
 * Contient la logique commune partagée entre SME et Institution services
 */
@Injectable()
export abstract class BaseCustomerService<T> {
  constructor(
    protected readonly customerRepository: Repository<Customer>,
    protected readonly customerEventsProducer: CustomerEventsProducer,
    protected readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Méthode abstraite pour trouver un client par son ID
   * Chaque service concret doit implémenter sa propre logique
   */
  abstract findById(id: string): Promise<T>;

  /**
   * Valider un client
   * Logique commune pour tous les types de clients
   */
  async validate(id: string, validatedBy: string): Promise<Customer> {
    const customer = await this.getCustomerEntity(id);
    
    customer.status = CustomerStatus.ACTIVE;
    customer.validatedAt = new Date();
    customer.validatedBy = validatedBy;
    
    // Ajouter à l'historique de validation
    if (!customer.validationHistory) {
      customer.validationHistory = [];
    }
    customer.validationHistory.push({
      date: new Date(),
      action: 'validated',
      by: validatedBy,
      notes: 'Client validé avec succès'
    });
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Publier l'événement Kafka
    await this.customerEventsProducer.customerValidated(savedCustomer);
    
    return savedCustomer;
  }

  /**
   * Suspendre un client
   * Logique commune pour tous les types de clients
   */
  async suspend(id: string, suspendedBy: string, reason: string): Promise<Customer> {
    const customer = await this.getCustomerEntity(id);
    
    customer.status = CustomerStatus.SUSPENDED;
    customer.suspendedAt = new Date();
    customer.suspendedBy = suspendedBy;
    customer.suspensionReason = reason;
    
    // Ajouter à l'historique de validation
    if (!customer.validationHistory) {
      customer.validationHistory = [];
    }
    customer.validationHistory.push({
      date: new Date(),
      action: 'revoked',
      by: suspendedBy,
      notes: `Client suspendu: ${reason}`
    });
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Publier l'événement Kafka
    await this.customerEventsProducer.customerSuspended(savedCustomer);
    
    return savedCustomer;
  }

  /**
   * Rejeter un client
   * Logique commune pour tous les types de clients
   */
  async reject(id: string, rejectedBy: string, reason: string): Promise<Customer> {
    const customer = await this.getCustomerEntity(id);
    
    customer.status = CustomerStatus.INACTIVE;
    customer.rejectedAt = new Date();
    customer.rejectedBy = rejectedBy;
    customer.suspensionReason = reason; // Réutilise le champ pour la raison de rejet
    
    // Ajouter à l'historique de validation
    if (!customer.validationHistory) {
      customer.validationHistory = [];
    }
    customer.validationHistory.push({
      date: new Date(),
      action: 'revoked',
      by: rejectedBy,
      notes: `Client rejeté: ${reason}`
    });
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Publier l'événement Kafka (utilise le même événement que suspend)
    await this.customerEventsProducer.customerSuspended(savedCustomer);
    
    return savedCustomer;
  }

  /**
   * Réactiver un client
   * Logique commune pour tous les types de clients
   */
  async reactivate(id: string, reactivatedBy: string): Promise<Customer> {
    const customer = await this.getCustomerEntity(id);
    
    customer.status = CustomerStatus.ACTIVE;
    customer.reactivatedAt = new Date();
    customer.reactivatedBy = reactivatedBy;
    
    // Les champs de suspension/rejet restent pour l'historique
    // La réactivation est marquée par le statut ACTIVE et reactivatedAt
    
    // Ajouter à l'historique de validation
    if (!customer.validationHistory) {
      customer.validationHistory = [];
    }
    customer.validationHistory.push({
      date: new Date(),
      action: 'validated',
      by: reactivatedBy,
      notes: 'Client réactivé'
    });
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Publier l'événement Kafka
    await this.customerEventsProducer.customerValidated(savedCustomer);
    
    return savedCustomer;
  }

  /**
   * Upload d'un logo/image
   * Logique commune pour les uploads d'images
   */
  async uploadImage(
    customerId: string, 
    file: MulterFile, 
    folder: string = 'logos'
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new NotFoundException('Aucun fichier fourni');
    }

    // Valider le type de fichier
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.');
    }

    // Valider la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux. Maximum 5MB autorisé.');
    }

    try {
      // Upload vers Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        `${folder}/${customerId}`
      );

      return {
        url: uploadResult.url,
        message: 'Image uploadée avec succès',
        fileName: file.originalname,
        size: file.size
      };
    } catch (error: any) {
      throw new Error(`Erreur lors de l'upload: ${error.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Upload d'un document (CV, etc.)
   * Logique commune pour les uploads de documents
   */
  async uploadDocument(
    customerId: string, 
    file: MulterFile, 
    folder: string = 'documents'
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new NotFoundException('Aucun fichier fourni');
    }

    // Valider le type de fichier
    const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Type de fichier non supporté. Utilisez PDF, DOC ou DOCX.');
    }

    // Valider la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux. Maximum 10MB autorisé.');
    }

    try {
      // Upload vers Cloudinary (utilise la même méthode que pour les images)
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        `${folder}/${customerId}/${file.originalname}`
      );

      return {
        url: uploadResult.url,
        message: 'Document uploadé avec succès',
        fileName: file.originalname,
        size: file.size
      };
    } catch (error: any) {
      throw new Error(`Erreur lors de l'upload: ${error.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifier si un utilisateur est propriétaire d'un client
   * Logique commune pour la vérification des droits
   */
  async isCustomerOwner(customerId: string, auth0Id: string): Promise<boolean> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['users']
    });

    if (!customer) {
      return false;
    }

    // Vérifier si l'utilisateur est le créateur ou un utilisateur associé
    return customer.ownerId === auth0Id || 
           customer.users?.some(user => user.auth0Id === auth0Id);
  }

  /**
   * Récupérer l'entité Customer de base
   * Méthode helper utilisée dans les opérations communes
   */
  protected async getCustomerEntity(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['users', 'subscriptions']
    });

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    return customer;
  }

  /**
   * Générer un UUID simple
   * Utilitaire commun
   */
  protected generateId(): string {
    return 'id-' + Math.random().toString(36).substr(2, 16);
  }
}