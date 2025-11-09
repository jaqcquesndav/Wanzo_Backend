import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePortfolioUserDto, UpdatePortfolioUserDto, PortfolioUserResponseDto } from '../dto/portfolio-user.dto';

/**
 * Service de gestion des utilisateurs du portefeuille d'institution
 * Mock implementation pour le développement
 */
@Injectable()
export class PortfolioUserService {

  /**
   * Créer un nouvel utilisateur dans le portefeuille
   */
  async create(createDto: CreatePortfolioUserDto): Promise<PortfolioUserResponseDto> {
    // Mock implementation - simulate database operation
    const mockUser: PortfolioUserResponseDto = {
      id: `user_${Date.now()}`,
      email: createDto.email,
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      role: createDto.role,
      institutionId: createDto.institutionId,
      permissions: createDto.permissions || [],
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return mockUser;
  }

  /**
   * Récupérer tous les utilisateurs d'une institution
   */
  async findByInstitution(institutionId: string): Promise<PortfolioUserResponseDto[]> {
    // Mock implementation
    const mockUsers: PortfolioUserResponseDto[] = [
      {
        id: 'user_1',
        email: 'admin@institution.com',
        firstName: 'Admin',
        lastName: 'Institution',
        role: 'admin',
        institutionId,
        permissions: ['all'],
        isActive: true,
        lastLoginAt: new Date(Date.now() - 86400000), // Yesterday
        createdAt: new Date(Date.now() - 86400000 * 30), // 30 days ago
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'user_2',
        email: 'analyst@institution.com',
        firstName: 'Analyst',
        lastName: 'Portfolio',
        role: 'analyst',
        institutionId,
        permissions: ['portfolio:read', 'analytics:read'],
        isActive: true,
        lastLoginAt: new Date(Date.now() - 3600000), // 1 hour ago
        createdAt: new Date(Date.now() - 86400000 * 15), // 15 days ago
        updatedAt: new Date(Date.now() - 3600000)
      }
    ];

    return mockUsers;
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async findOne(id: string): Promise<PortfolioUserResponseDto> {
    if (!id || id === 'non-existent') {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Mock implementation
    const mockUser: PortfolioUserResponseDto = {
      id,
      email: 'user@institution.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'analyst',
      institutionId: 'inst_123',
      permissions: ['portfolio:read', 'portfolio:write'],
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000),
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 3600000)
    };

    return mockUser;
  }

  /**
   * Récupérer tous les utilisateurs
   */
  async findAll(): Promise<PortfolioUserResponseDto[]> {
    // Mock implementation - return all users
    const mockUsers: PortfolioUserResponseDto[] = [
      {
        id: 'user_1',
        email: 'admin@institution.com',
        firstName: 'Alice',
        lastName: 'Admin',
        role: 'admin',
        institutionId: 'inst_123',
        permissions: ['all'],
        department: 'Administration',
        isActive: true,
        lastLoginAt: new Date(Date.now() - 1800000),
        createdAt: new Date(Date.now() - 86400000 * 30),
        updatedAt: new Date(Date.now() - 1800000)
      },
      {
        id: 'user_2',
        email: 'analyst@institution.com',
        firstName: 'Bob',
        lastName: 'Analyst',
        role: 'analyst',
        institutionId: 'inst_456',
        permissions: ['portfolio:read', 'analytics:read'],
        department: 'Analytics',
        isActive: true,
        lastLoginAt: new Date(Date.now() - 3600000),
        createdAt: new Date(Date.now() - 86400000 * 15),
        updatedAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'user_3',
        email: 'manager@institution.com',
        firstName: 'Carol',
        lastName: 'Manager',
        role: 'manager',
        institutionId: 'inst_789',
        permissions: ['portfolio:read', 'portfolio:write', 'users:manage'],
        department: 'Management',
        isActive: true,
        lastLoginAt: new Date(Date.now() - 7200000),
        createdAt: new Date(Date.now() - 86400000 * 7),
        updatedAt: new Date(Date.now() - 7200000)
      }
    ];

    return mockUsers;
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(id: string, updateDto: UpdatePortfolioUserDto): Promise<PortfolioUserResponseDto> {
    const existingUser = await this.findOne(id);

    // Mock implementation - merge updates
    const updatedUser: PortfolioUserResponseDto = {
      ...existingUser,
      ...updateDto,
      updatedAt: new Date()
    };

    return updatedUser;
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async remove(id: string): Promise<void> {
    const existingUser = await this.findOne(id);
    
    if (!existingUser.isActive) {
      throw new BadRequestException(`L'utilisateur ${id} est déjà désactivé`);
    }

    // Mock implementation - just log the operation
    console.log(`Utilisateur ${id} désactivé avec succès`);
  }

  /**
   * Activer/désactiver un utilisateur
   */
  async toggleStatus(id: string): Promise<PortfolioUserResponseDto> {
    const existingUser = await this.findOne(id);
    
    const updatedUser: PortfolioUserResponseDto = {
      ...existingUser,
      isActive: !existingUser.isActive,
      updatedAt: new Date()
    };

    return updatedUser;
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    const existingUser = await this.findOne(id);
    
    // Mock implementation
    const temporaryPassword = `temp_${Math.random().toString(36).substr(2, 12)}`;
    
    console.log(`Mot de passe réinitialisé pour l'utilisateur ${existingUser.email}`);
    
    return { temporaryPassword };
  }

  /**
   * Récupérer les statistiques des utilisateurs d'une institution
   */
  async getInstitutionStats(institutionId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: Record<string, number>;
    recentLogins: number;
  }> {
    const users = await this.findByInstitution(institutionId);
    
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      inactiveUsers: users.filter(u => !u.isActive).length,
      usersByRole: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentLogins: users.filter(u => 
        u.lastLoginAt && 
        u.lastLoginAt > new Date(Date.now() - 86400000 * 7)
      ).length
    };

    return stats;
  }

  /**
   * Ajouter un utilisateur (alias pour create)
   */
  async addUser(createDto: CreatePortfolioUserDto): Promise<PortfolioUserResponseDto> {
    return await this.create(createDto);
  }

  /**
   * Activer un utilisateur
   */
  async activateUser(id: string): Promise<PortfolioUserResponseDto> {
    const user = await this.findOne(id);
    
    const activatedUser: PortfolioUserResponseDto = {
      ...user,
      isActive: true,
      updatedAt: new Date()
    };

    return activatedUser;
  }

  /**
   * Créer un rôle personnalisé
   */
  async createCustomRole(roleData: any): Promise<any> {
    // Mock custom role creation
    const customRole = {
      id: `role_${Date.now()}`,
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions || [],
      createdAt: new Date(),
      isCustom: true
    };

    return customRole;
  }

  /**
   * Récupérer les utilisateurs (alias pour findByInstitution)
   */
  async getUsers(institutionId: string): Promise<PortfolioUserResponseDto[]> {
    return await this.findByInstitution(institutionId);
  }

  /**
   * Récupérer un utilisateur (alias pour findOne)
   */
  async getUser(id: string): Promise<PortfolioUserResponseDto> {
    return await this.findOne(id);
  }

  /**
   * Mettre à jour un utilisateur (alias pour update)
   */
  async updateUser(id: string, updateDto: UpdatePortfolioUserDto): Promise<PortfolioUserResponseDto> {
    return await this.update(id, updateDto);
  }

  /**
   * Supprimer un utilisateur (alias pour remove)
   */
  async removeUser(id: string): Promise<void> {
    return await this.remove(id);
  }

  /**
   * Désactiver un utilisateur
   */
  async deactivateUser(id: string): Promise<PortfolioUserResponseDto> {
    const user = await this.findOne(id);
    
    const deactivatedUser: PortfolioUserResponseDto = {
      ...user,
      isActive: false,
      updatedAt: new Date()
    };

    return deactivatedUser;
  }

  /**
   * Récupérer les rôles disponibles
   */
  async getAvailableRoles(): Promise<any[]> {
    // Mock available roles
    const roles = [
      {
        id: 'admin',
        name: 'Administrateur',
        description: 'Accès complet au système',
        permissions: ['all']
      },
      {
        id: 'analyst',
        name: 'Analyste',
        description: 'Accès aux analyses et rapports',
        permissions: ['portfolio:read', 'analytics:read', 'reports:generate']
      },
      {
        id: 'manager',
        name: 'Gestionnaire',
        description: 'Gestion du portefeuille et des équipes',
        permissions: ['portfolio:read', 'portfolio:write', 'users:manage']
      },
      {
        id: 'viewer',
        name: 'Observateur',
        description: 'Accès en lecture seule',
        permissions: ['portfolio:read']
      }
    ];

    return roles;
  }

  /**
   * Assigner un rôle à un utilisateur
   */
  async assignRole(userId: string, roleId: string): Promise<PortfolioUserResponseDto> {
    const user = await this.findOne(userId);
    const roles = await this.getAvailableRoles();
    const role = roles.find(r => r.id === roleId);
    
    if (!role) {
      throw new BadRequestException(`Rôle ${roleId} non trouvé`);
    }

    const updatedUser: PortfolioUserResponseDto = {
      ...user,
      role: roleId,
      permissions: role.permissions,
      updatedAt: new Date()
    };

    return updatedUser;
  }

  /**
   * Retirer un rôle d'un utilisateur
   */
  async removeRole(userId: string, roleId: string): Promise<PortfolioUserResponseDto> {
    const user = await this.findOne(userId);
    
    const updatedUser: PortfolioUserResponseDto = {
      ...user,
      role: 'viewer', // Default role
      permissions: ['portfolio:read'], // Minimal permissions
      updatedAt: new Date()
    };

    return updatedUser;
  }
}