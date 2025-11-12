import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionLeadership } from '../entities/institution-leadership.entity';
import { 
  CreateLeadershipDto, 
  UpdateLeadershipDto, 
  LeadershipResponseDto,
  LeaderProfileDto,
  LeaderEducationDto,
  LeaderExperienceDto,
  LeaderSkillDto,
  LeaderResponsibilityDto
} from '../dto/institution-leadership.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion de la direction des institutions financières
 * Gère les dirigeants, leurs profils, formations, expériences et responsabilités
 */
@Injectable()
export class InstitutionLeadershipService {
  constructor(
    @InjectRepository(InstitutionLeadership)
    private readonly leadershipRepository: Repository<InstitutionLeadership>,
  ) {}

  /**
   * Ajouter un nouveau dirigeant à une institution financière
   */
  async addLeader(institutionId: string, createLeadershipDto: CreateLeadershipDto): Promise<LeadershipResponseDto> {
    try {
      // Vérification de l'unicité de l'email
      await this.checkLeaderEmailUniqueness(institutionId, createLeadershipDto.leader.email);

      // Création du nouveau dirigeant avec ID unique
      const leaderId = crypto.randomUUID();
      const currentDate = new Date().toISOString();
      
      const newLeader = this.leadershipRepository.create({
        id: leaderId,
        institutionId,
        firstName: createLeadershipDto.leader.firstName,
        lastName: createLeadershipDto.leader.lastName,
        fullName: `${createLeadershipDto.leader.firstName} ${createLeadershipDto.leader.lastName}`,
        position: createLeadershipDto.leader.position,
        department: createLeadershipDto.leader.department,
        email: createLeadershipDto.leader.email,
        phone: createLeadershipDto.leader.phone,
        profileImageUrl: createLeadershipDto.leader.profileImageUrl,
        bio: createLeadershipDto.leader.bio,
        startDate: createLeadershipDto.leader.startDate ? new Date(createLeadershipDto.leader.startDate) : new Date(),
        isActive: true,
        yearsOfExperience: createLeadershipDto.leader.yearsOfExperience || 0,
        education: createLeadershipDto.leader.education || [],
        experience: createLeadershipDto.leader.experience || [],
        skills: createLeadershipDto.leader.skills || [],
        responsibilities: createLeadershipDto.leader.responsibilities || [],
        achievements: createLeadershipDto.leader.achievements || [],
        certifications: createLeadershipDto.leader.certifications || [],
        languages: createLeadershipDto.leader.languages || [],
        socialLinks: createLeadershipDto.leader.socialLinks || {},
        createdAt: new Date(currentDate),
        updatedAt: new Date(currentDate),
      });

      const savedLeader = await this.leadershipRepository.save(newLeader);
      
      return this.mapLeaderToResponseDto(savedLeader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout du dirigeant: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour un dirigeant existant
   */
  async updateLeader(leaderId: string, updateLeadershipDto: UpdateLeadershipDto): Promise<LeadershipResponseDto> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      // Vérification de l'unicité de l'email si modifié
      if (updateLeadershipDto.leader?.email && updateLeadershipDto.leader.email !== leader.email) {
        await this.checkLeaderEmailUniqueness(leader.institutionId, updateLeadershipDto.leader.email, leaderId);
      }

      // Mise à jour des données
      const updatedLeader = this.leadershipRepository.merge(leader, {
        ...updateLeadershipDto.leader,
        fullName: updateLeadershipDto.leader?.firstName && updateLeadershipDto.leader?.lastName 
          ? `${updateLeadershipDto.leader.firstName} ${updateLeadershipDto.leader.lastName}`
          : leader.fullName,
        updatedAt: new Date(),
      });

      const savedLeader = await this.leadershipRepository.save(updatedLeader);
      
      return this.mapLeaderToResponseDto(savedLeader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour du dirigeant: ${errorMessage}`);
    }
  }

  /**
   * Récupérer tous les dirigeants d'une institution
   */
  async getLeaders(institutionId: string, page = 1, limit = 10): Promise<{ leaders: LeadershipResponseDto[], total: number }> {
    try {
      const [leaders, total] = await this.leadershipRepository.findAndCount({
        where: { institutionId },
        skip: (page - 1) * limit,
        take: limit,
        order: { position: 'ASC', lastName: 'ASC' }
      });

      return {
        leaders: leaders.map(leader => this.mapLeaderToResponseDto(leader)),
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des dirigeants: ${errorMessage}`);
    }
  }

  /**
   * Récupérer un dirigeant par ID
   */
  async getLeaderById(leaderId: string): Promise<LeadershipResponseDto> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      return this.mapLeaderToResponseDto(leader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération du dirigeant: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les dirigeants par rôle
   */
  async getLeadersByRole(institutionId: string, position: string): Promise<LeadershipResponseDto[]> {
    try {
      const leaders = await this.leadershipRepository.find({
        where: { institutionId, position },
        order: { lastName: 'ASC' }
      });

      return leaders.map(leader => this.mapLeaderToResponseDto(leader));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des dirigeants par rôle: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les dirigeants actifs
   */
  async getActiveLeaders(institutionId: string): Promise<LeadershipResponseDto[]> {
    try {
      const leaders = await this.leadershipRepository.find({
        where: { institutionId, isActive: true },
        order: { position: 'ASC', lastName: 'ASC' }
      });

      return leaders.map(leader => this.mapLeaderToResponseDto(leader));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des dirigeants actifs: ${errorMessage}`);
    }
  }

  /**
   * Supprimer un dirigeant
   */
  async deleteLeader(leaderId: string): Promise<void> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      // Soft delete en désactivant le dirigeant
      leader.isActive = false;
      leader.endDate = new Date();
      leader.updatedAt = new Date();
      
      await this.leadershipRepository.save(leader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la suppression du dirigeant: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour le statut d'un dirigeant
   */
  async updateLeaderStatus(leaderId: string, isActive: boolean): Promise<LeadershipResponseDto> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      leader.isActive = isActive;
      if (!isActive) {
        leader.endDate = new Date();
      } else {
        leader.endDate = undefined;
      }
      leader.updatedAt = new Date();
      
      const updatedLeader = await this.leadershipRepository.save(leader);
      
      return this.mapLeaderToResponseDto(updatedLeader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour du statut: ${errorMessage}`);
    }
  }

  /**
   * Ajouter une formation à un dirigeant
   */
  async addEducation(leaderId: string, education: LeaderEducationDto): Promise<LeadershipResponseDto> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      const newEducation = {
        ...education,
        id: crypto.randomUUID(),
      };

      leader.education = [...(leader.education || []), newEducation];
      leader.updatedAt = new Date();
      
      const updatedLeader = await this.leadershipRepository.save(leader);
      
      return this.mapLeaderToResponseDto(updatedLeader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de la formation: ${errorMessage}`);
    }
  }

  /**
   * Ajouter une expérience à un dirigeant
   */
  async addExperience(leaderId: string, experience: LeaderExperienceDto): Promise<LeadershipResponseDto> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      const newExperience = {
        ...experience,
        id: crypto.randomUUID(),
      };

      leader.experience = [...(leader.experience || []), newExperience];
      leader.updatedAt = new Date();
      
      const updatedLeader = await this.leadershipRepository.save(leader);
      
      return this.mapLeaderToResponseDto(updatedLeader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de l'expérience: ${errorMessage}`);
    }
  }

  /**
   * Ajouter une compétence à un dirigeant
   */
  async addSkill(leaderId: string, skill: LeaderSkillDto): Promise<LeadershipResponseDto> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      const newSkill = {
        ...skill,
        id: crypto.randomUUID(),
      };

      leader.skills = [...(leader.skills || []), newSkill];
      leader.updatedAt = new Date();
      
      const updatedLeader = await this.leadershipRepository.save(leader);
      
      return this.mapLeaderToResponseDto(updatedLeader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de la compétence: ${errorMessage}`);
    }
  }

  /**
   * Ajouter une responsabilité à un dirigeant
   */
  async addResponsibility(leaderId: string, responsibility: LeaderResponsibilityDto): Promise<LeadershipResponseDto> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      const newResponsibility = {
        ...responsibility,
        id: crypto.randomUUID(),
        startDate: responsibility.startDate || new Date().toISOString(),
      };

      leader.responsibilities = [...(leader.responsibilities || []), newResponsibility];
      leader.updatedAt = new Date();
      
      const updatedLeader = await this.leadershipRepository.save(leader);
      
      return this.mapLeaderToResponseDto(updatedLeader);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de la responsabilité: ${errorMessage}`);
    }
  }

  /**
   * Générer l'organigramme de l'institution
   */
  async generateOrganizationChart(institutionId: string): Promise<any> {
    try {
      const leaders = await this.leadershipRepository.find({
        where: { institutionId, isActive: true },
        order: { position: 'ASC', department: 'ASC' }
      });

      // Regroupement par département
      const departmentStructure: { [key: string]: any[] } = {};
      
      for (const leader of leaders) {
        const dept = leader.department || 'Direction Générale';
        if (!departmentStructure[dept]) {
          departmentStructure[dept] = [];
        }
        
        departmentStructure[dept].push({
          id: leader.id,
          name: leader.fullName,
          position: leader.position,
          email: leader.email,
          phone: leader.phone,
          profileImageUrl: leader.profileImageUrl,
          yearsOfExperience: leader.yearsOfExperience,
          startDate: leader.startDate?.toISOString(),
        });
      }

      // Hiérarchie par position
      const hierarchy = this.buildHierarchy(leaders);

      return {
        institutionId,
        totalLeaders: leaders.length,
        departmentStructure,
        hierarchy,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la génération de l'organigramme: ${errorMessage}`);
    }
  }

  /**
   * Générer des statistiques de leadership
   */
  async generateLeadershipStatistics(institutionId: string): Promise<any> {
    try {
      const leaders = await this.leadershipRepository.find({
        where: { institutionId }
      });

      const activeLeaders = leaders.filter(leader => leader.isActive);
      
      // Statistiques par département
      const departmentStats: { [key: string]: number } = {};
      for (const leader of leaders) {
        const dept = leader.department || 'Direction Générale';
        departmentStats[dept] = (departmentStats[dept] || 0) + 1;
      }

      // Statistiques par années d'expérience
      const experienceStats = {
        junior: leaders.filter(l => l.yearsOfExperience < 5).length,
        intermediate: leaders.filter(l => l.yearsOfExperience >= 5 && l.yearsOfExperience < 10).length,
        senior: leaders.filter(l => l.yearsOfExperience >= 10 && l.yearsOfExperience < 20).length,
        expert: leaders.filter(l => l.yearsOfExperience >= 20).length,
      };

      // Compétences les plus communes
      const allSkills = leaders.flatMap(leader => leader.skills || []);
      const skillsCount: { [key: string]: number } = {};
      for (const skill of allSkills) {
        if (skill.name) {
          skillsCount[skill.name] = (skillsCount[skill.name] || 0) + 1;
        }
      }

      const topSkills = Object.entries(skillsCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));

      return {
        summary: {
          totalLeaders: leaders.length,
          activeLeaders: activeLeaders.length,
          averageExperience: leaders.length > 0 ? 
            leaders.reduce((sum, leader) => sum + leader.yearsOfExperience, 0) / leaders.length : 0,
        },
        departmentStats,
        experienceStats,
        topSkills,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des statistiques: ${errorMessage}`);
    }
  }

  // Méthodes privées

  /**
   * Vérifier l'unicité de l'email du dirigeant
   */
  private async checkLeaderEmailUniqueness(institutionId: string, email: string, excludeLeaderId?: string): Promise<void> {
    const existingLeader = await this.leadershipRepository
      .createQueryBuilder('leader')
      .where('leader.institutionId = :institutionId', { institutionId })
      .andWhere('leader.email = :email', { email })
      .andWhere(excludeLeaderId ? 'leader.id != :excludeLeaderId' : '1=1', { excludeLeaderId })
      .getOne();

    if (existingLeader) {
      throw new Error(`Un dirigeant avec l'email "${email}" existe déjà`);
    }
  }

  /**
   * Construire la hiérarchie des dirigeants
   */
  private buildHierarchy(leaders: InstitutionLeadership[]): any {
    // Positions hiérarchiques typiques
    const positionRanks: { [key: string]: number } = {
      'PDG': 1,
      'CEO': 1,
      'Directeur Général': 1,
      'DG': 1,
      'Directeur Général Adjoint': 2,
      'DGA': 2,
      'Directeur': 3,
      'Directeur Adjoint': 4,
      'Chef de Département': 5,
      'Chef de Service': 6,
      'Manager': 7,
      'Responsable': 8,
    };

    return leaders
      .sort((a, b) => {
        const rankA = positionRanks[a.position] || 10;
        const rankB = positionRanks[b.position] || 10;
        return rankA - rankB;
      })
      .map(leader => ({
        id: leader.id,
        name: leader.fullName,
        position: leader.position,
        department: leader.department,
        rank: positionRanks[leader.position] || 10,
        isActive: leader.isActive,
      }));
  }

  /**
   * Mapper l'entité Leadership vers LeadershipResponseDto
   */
  private mapLeaderToResponseDto(leader: InstitutionLeadership): LeadershipResponseDto {
    return {
      id: leader.id,
      institutionId: leader.institutionId,
      firstName: leader.firstName,
      lastName: leader.lastName,
      fullName: leader.fullName,
      position: leader.position,
      department: leader.department,
      email: leader.email,
      phone: leader.phone,
      profileImageUrl: leader.profileImageUrl,
      bio: leader.bio,
      startDate: leader.startDate?.toISOString(),
      endDate: leader.endDate?.toISOString(),
      isActive: leader.isActive,
      yearsOfExperience: leader.yearsOfExperience,
      education: leader.education || [],
      experience: leader.experience || [],
      skills: leader.skills || [],
      responsibilities: leader.responsibilities || [],
      achievements: leader.achievements || [],
      certifications: leader.certifications || [],
      languages: leader.languages || [],
      socialLinks: leader.socialLinks || {},
      createdAt: leader.createdAt.toISOString(),
      updatedAt: leader.updatedAt.toISOString(),
    };
  }
}