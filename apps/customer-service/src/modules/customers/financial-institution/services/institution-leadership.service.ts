import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionLeadershipEntity } from '../entities/institution-leadership.entity';
import { 
  CreateLeadershipDto, 
  UpdateLeadershipDto, 
  LeadershipResponseDto,
  EducationDto,
  ProfessionalExperienceDto,
  SkillDto,
  ResponsibilityDto
} from '../dto/institution-leadership.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion de la direction des institutions financières
 * Gère les dirigeants, leurs profils, formations, expériences et responsabilités
 */
@Injectable()
export class InstitutionLeadershipService {
  constructor(
    @InjectRepository(InstitutionLeadershipEntity)
    private readonly leadershipRepository: Repository<InstitutionLeadershipEntity>,
  ) {}

  /**
   * Ajouter un nouveau dirigeant à une institution financière
   */
  async addLeader(institutionId: string, createLeadershipDto: CreateLeadershipDto): Promise<LeadershipResponseDto> {
    try {
      const leaderData = createLeadershipDto.leadership;
      
      // Vérification de l'unicité de l'email
      if (leaderData.contact?.professionalEmail) {
        await this.checkLeaderEmailUniqueness(institutionId, leaderData.contact.professionalEmail);
      }

      // Création du nouveau dirigeant avec ID unique
      const leaderId = crypto.randomUUID();
      const currentDate = new Date().toISOString();
      
      const newLeader = this.leadershipRepository.create({
        institutionId,
        firstName: leaderData.firstName,
        lastName: leaderData.lastName,
        fullName: `${leaderData.firstName} ${leaderData.lastName}`,
        role: leaderData.role,
        level: 'executive',
        department: '',
        appointmentDate: leaderData.appointmentDate ? new Date(leaderData.appointmentDate) : new Date(),
        isCurrentPosition: leaderData.status === 'active',
        status: leaderData.status || 'active',
        professionalExperience: leaderData.experience || [],
        email: leaderData.contact?.professionalEmail || '',
        phone: leaderData.contact?.professionalPhone || '',
      } as any);

      const savedLeader = await this.leadershipRepository.save(newLeader);
      
      return this.mapLeaderToResponseDto(Array.isArray(savedLeader) ? savedLeader[0] : savedLeader);
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

      const leaderData = updateLeadershipDto.leadership;

      // Vérification de l'unicité de l'email si modifié
      if (leaderData?.contact?.professionalEmail && leaderData.contact.professionalEmail !== leader.email) {
        await this.checkLeaderEmailUniqueness(leader.institutionId, leaderData.contact.professionalEmail, leaderId);
      }

      // Mise à jour des données
      const updateData: any = {};
      if (leaderData?.firstName) updateData.firstName = leaderData.firstName;
      if (leaderData?.lastName) updateData.lastName = leaderData.lastName;
      if (leaderData?.title) updateData.position = leaderData.title;
      if (leaderData?.contact?.professionalEmail) updateData.email = leaderData.contact.professionalEmail;
      if (leaderData?.contact?.professionalPhone) updateData.phone = leaderData.contact.professionalPhone;
      if (leaderData?.profilePhotoUrl) updateData.profileImageUrl = leaderData.profilePhotoUrl;
      if (leaderData?.biography) updateData.bio = leaderData.biography;
      if (leaderData?.appointmentDate) updateData.startDate = new Date(leaderData.appointmentDate);
      if (leaderData?.status) updateData.isActive = leaderData.status === 'active';
      if (leaderData?.education) updateData.education = leaderData.education;
      if (leaderData?.experience) updateData.experience = leaderData.experience;
      if (leaderData?.skills) updateData.skills = leaderData.skills;
      if (leaderData?.responsibilities) updateData.responsibilities = leaderData.responsibilities;
      if (leaderData?.languages) updateData.languages = leaderData.languages;
      
      if (leaderData?.firstName && leaderData?.lastName) {
        updateData.fullName = `${leaderData.firstName} ${leaderData.lastName}`;
      }
      
      updateData.updatedAt = new Date();

      const updatedLeader = this.leadershipRepository.merge(leader, updateData);

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
        order: { role: 'ASC', lastName: 'ASC' }
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
        where: { institutionId, role: position as any },
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
        where: { institutionId, isCurrentPosition: true },
        order: { role: 'ASC', lastName: 'ASC' }
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
      leader.isCurrentPosition = false;
      leader.actualEndDate = new Date();
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

      leader.isCurrentPosition = isActive;
      if (!isActive) {
        leader.actualEndDate = new Date();
      } else {
        leader.actualEndDate = undefined;
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
  async addEducation(leaderId: string, education: any): Promise<LeadershipResponseDto> {
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
  async addExperience(leaderId: string, experience: any): Promise<LeadershipResponseDto> {
    try {
      const leader = await this.leadershipRepository.findOne({ where: { id: leaderId } });
      
      if (!leader) {
        throw new Error('Dirigeant non trouvé');
      }

      const newExperience = {
        ...experience,
        id: crypto.randomUUID(),
      };

      // TODO: implémenter experience (propriété non existante)
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
  async addSkill(leaderId: string, skill: any): Promise<LeadershipResponseDto> {
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
  async addResponsibility(leaderId: string, responsibility: any): Promise<LeadershipResponseDto> {
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

      // TODO: implémenter responsibilities (propriété non existante dans entité)
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
        where: { institutionId, isCurrentPosition: true },
        order: { role: 'ASC', department: 'ASC' }
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
          position: leader.role,
          email: leader.email,
          phone: leader.phone,
          profileImageUrl: '',
          yearsOfExperience: leader.totalExperienceYears || 0,
          startDate: leader.appointmentDate?.toISOString(),
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

      const activeLeaders = leaders.filter(leader => leader.isCurrentPosition);
      
      // Statistiques par département
      const departmentStats: { [key: string]: number } = {};
      for (const leader of leaders) {
        const dept = leader.department || 'Direction Générale';
        departmentStats[dept] = (departmentStats[dept] || 0) + 1;
      }

      // Statistiques par années d'expérience
      const experienceStats = {
        junior: leaders.filter(l => (l.totalExperienceYears || 0) < 5).length,
        mid: leaders.filter(l => (l.totalExperienceYears || 0) >= 5 && (l.totalExperienceYears || 0) < 10).length,
        senior: leaders.filter(l => (l.totalExperienceYears || 0) >= 10 && (l.totalExperienceYears || 0) < 20).length,
        expert: leaders.filter(l => (l.totalExperienceYears || 0) >= 20).length,
      };

      // Compétences les plus communes
      const allSkills = leaders.flatMap(leader => leader.skills || []);
      const skillsCount: { [key: string]: number } = {};
      for (const skill of allSkills) {
        if (skill.category) {
          skillsCount[skill.category] = (skillsCount[skill.category] || 0) + 1;
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
            leaders.reduce((sum, leader) => sum + (leader.totalExperienceYears || 0), 0) / leaders.length : 0,
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
  private buildHierarchy(leaders: InstitutionLeadershipEntity[]): any {
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
        const rankA = positionRanks[a.role] || 10;
        const rankB = positionRanks[b.role] || 10;
        return rankA - rankB;
      })
      .map(leader => ({
        id: leader.id,
        name: leader.fullName,
        position: leader.role,
        department: leader.department,
        rank: positionRanks[leader.role] || 10,
        isActive: leader.isCurrentPosition,
      }));
  }

  /**
   * Mapper l'entité Leadership vers LeadershipResponseDto
   */
  private mapLeaderToResponseDto(leader: InstitutionLeadershipEntity): LeadershipResponseDto {
    return {
      id: leader.id,
      institutionId: leader.institutionId,
      firstName: leader.firstName || '',
      lastName: leader.lastName || '',
      role: leader.role as any,
      title: leader.customRoleTitle || leader.role || '',
      status: leader.status as any,
      appointmentDate: leader.appointmentDate?.toISOString() || new Date().toISOString(),
      endDate: leader.actualEndDate?.toISOString(),
      contact: {
        professionalEmail: leader.email || '',
        professionalPhone: leader.phone || '',
        // professionalAddress non disponible dans DTO
      },
      profilePhotoUrl: '',
      biography: '',
      education: (leader.education || []).map(e => ({
        institution: e.institution,
        level: 'bachelors' as any,
        fieldOfStudy: e.field,
        graduationYear: e.graduationYear
      })),
      experience: (leader.professionalExperience || []).map(exp => ({
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        isCurrent: !exp.endDate
      })),
      skills: (leader.skills || []).flatMap(s => 
        s.skills.map(skill => ({
          name: skill,
          category: s.category,
          level: s.level,
          yearsOfExperience: 0
        }))
      ),
      responsibilities: [],
      languages: (leader.languages || []).map(l => ({
        language: l.language,
        proficiency: l.level,
        certification: ''
      })),
      createdAt: leader.createdAt.toISOString(),
      updatedAt: leader.updatedAt.toISOString(),
    };
  }
}