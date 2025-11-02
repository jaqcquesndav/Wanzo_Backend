import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityOpportunity } from '../entities/security-opportunity.entity';
import { Meeting } from '../entities/meeting.entity';
import { ContactHistory } from '../entities/contact-history.entity';
import { Company } from '../entities/company.entity';
import { ContactRequestDto, MeetingRequestDto, OpportunityFiltersDto } from '../dtos/prospection.dto';
import { CompanyService } from './company.service';

@Injectable()
export class ProspectionService {
  constructor(
    @InjectRepository(SecurityOpportunity)
    private readonly opportunityRepository: Repository<SecurityOpportunity>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(ContactHistory)
    private readonly contactHistoryRepository: Repository<ContactHistory>,
    private readonly companyService: CompanyService,
  ) {}

  async getOpportunities(filters: OpportunityFiltersDto, institutionId: string) {
    const queryBuilder = this.opportunityRepository.createQueryBuilder('opportunity');
    
    queryBuilder
      .leftJoinAndSelect('opportunity.company', 'company')
      .where('opportunity.institution_id = :institutionId', { institutionId });

    if (filters.status) {
      queryBuilder.andWhere('opportunity.status = :status', { status: filters.status });
    }

    if (filters.sector) {
      queryBuilder.andWhere('opportunity.sector ILIKE :sector', { sector: `%${filters.sector}%` });
    }

    if (filters.region) {
      queryBuilder.andWhere('opportunity.region ILIKE :region', { region: `%${filters.region}%` });
    }

    if (filters.searchTerm) {
      queryBuilder.andWhere(
        '(company.name ILIKE :searchTerm OR opportunity.description ILIKE :searchTerm)',
        { searchTerm: `%${filters.searchTerm}%` }
      );
    }

    queryBuilder.orderBy('opportunity.created_at', 'DESC');

    const opportunities = await queryBuilder.getMany();

    return {
      data: opportunities.map(opp => ({
        id: opp.id,
        companyId: opp.company_id,
        companyName: opp.company.name,
        type: opp.type,
        status: opp.status,
        sector: opp.sector,
        region: opp.region,
        details: opp.details,
        created_at: opp.created_at.toISOString(),
        updated_at: opp.updated_at.toISOString()
      })),
      meta: {
        total: opportunities.length,
        filtered: opportunities.length
      }
    };
  }

  async initiateContact(contactRequest: ContactRequestDto, institutionId: string, userId: string) {
    // Vérifier que l'entreprise existe
    const company = await this.companyService.findOne(contactRequest.companyId, institutionId);

    // Créer l'historique de contact
    const contactHistory = this.contactHistoryRepository.create({
      companyId: contactRequest.companyId,
      type: contactRequest.contactType,
      notes: contactRequest.notes,
      createdBy: userId,
    });

    await this.contactHistoryRepository.save(contactHistory);

    // Mettre à jour le dernier contact de l'entreprise
    const updatedCompany = await this.companyService.updateLastContact(contactRequest.companyId, institutionId);

    return {
      success: true,
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        status: 'contacted',
        lastContact: updatedCompany.lastContact?.toISOString()
      }
    };
  }

  async scheduleMeeting(meetingRequest: MeetingRequestDto, institutionId: string, userId: string) {
    // Vérifier que l'entreprise existe
    const company = await this.companyService.findOne(meetingRequest.companyId, institutionId);

    // Créer la réunion
    const meeting = this.meetingRepository.create({
      company_id: meetingRequest.companyId,
      portfolio_manager_id: userId,
      meeting_date: new Date(meetingRequest.date),
      meeting_time: meetingRequest.time,
      meeting_type: meetingRequest.type,
      location: meetingRequest.location,
      notes: meetingRequest.notes,
      institution_id: institutionId,
      created_by: userId,
    });

    const savedMeeting = await this.meetingRepository.save(meeting);

    return {
      success: true,
      meeting: {
        id: savedMeeting.id,
        companyId: savedMeeting.company_id,
        companyName: company.name,
        type: savedMeeting.meeting_type,
        date: meetingRequest.date,
        time: savedMeeting.meeting_time,
        location: savedMeeting.location,
        notes: savedMeeting.notes,
        createdAt: savedMeeting.created_at.toISOString()
      }
    };
  }

  async createOpportunity(opportunityData: any, institutionId: string, userId: string): Promise<SecurityOpportunity> {
    const opportunity = this.opportunityRepository.create({
      ...opportunityData,
      institution_id: institutionId,
      created_by: userId,
    });

    const result = await this.opportunityRepository.save(opportunity);
    return Array.isArray(result) ? result[0] : result;
  }
}