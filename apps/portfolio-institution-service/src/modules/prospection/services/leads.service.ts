import { Injectable } from '@nestjs/common';
import { SearchLeadsDto } from '../dto/search-leads.dto';

interface Lead {
  id: string;
  companyName: string;
  sector: string;
  region: string;
  revenue: number;
  employees: number;
  foundedYear: number;
  growthRate: number;
  creditScore: number;
  contactInfo: {
    name: string;
    position: string;
    email: string;
    phone: string;
  };
  lastContact: Date | null;
  score: number;
  recommendation: string;
}

@Injectable()
export class LeadsService {
  // In a real implementation, this would connect to an external data source or AI service
  // Here we're implementing a mock that returns simulated leads data
  async searchLeads(searchLeadsDto: SearchLeadsDto): Promise<{ leads: Lead[]; total: number; averageScore: number }> {
    // Simulated leads data
    const mockLeads: Lead[] = [
      {
        id: 'lead-123456',
        companyName: 'InnovTech Solutions',
        sector: 'technology',
        region: 'Île-de-France',
        revenue: 5000000,
        employees: 45,
        foundedYear: 2018,
        growthRate: 12,
        creditScore: 82,
        contactInfo: {
          name: 'Sophie Martin',
          position: 'Directrice Financière',
          email: 's.martin@innovtech.example',
          phone: '+33 1 23 45 67 89',
        },
        lastContact: null,
        score: 87,
        recommendation: 'Excellent candidat pour financement de croissance',
      },
      {
        id: 'lead-123457',
        companyName: 'FintechPro',
        sector: 'finance',
        region: 'Île-de-France',
        revenue: 3500000,
        employees: 30,
        foundedYear: 2019,
        growthRate: 15,
        creditScore: 79,
        contactInfo: {
          name: 'Thomas Dubois',
          position: 'CEO',
          email: 't.dubois@fintechpro.example',
          phone: '+33 1 98 76 54 32',
        },
        lastContact: new Date('2025-05-15T14:30:00Z'),
        score: 85,
        recommendation: 'Potentiel élevé pour solutions d\'investissement',
      },
      {
        id: 'lead-123458',
        companyName: 'GreenEnergy',
        sector: 'energy',
        region: 'Provence-Alpes-Côte d\'Azur',
        revenue: 2800000,
        employees: 25,
        foundedYear: 2020,
        growthRate: 18,
        creditScore: 75,
        contactInfo: {
          name: 'Jean Rousseau',
          position: 'Directeur Technique',
          email: 'j.rousseau@greenenergy.example',
          phone: '+33 4 56 78 90 12',
        },
        lastContact: null,
        score: 80,
        recommendation: 'Entreprise à forte croissance dans un secteur d\'avenir',
      },
    ];

    // Filter leads based on search criteria
    let filteredLeads = [...mockLeads];

    if (searchLeadsDto.sector && searchLeadsDto.sector.length > 0) {
      filteredLeads = filteredLeads.filter(lead => 
        searchLeadsDto.sector!.some(s => lead.sector.toLowerCase() === s.toLowerCase())
      );
    }

    if (searchLeadsDto.region && searchLeadsDto.region.length > 0) {
      filteredLeads = filteredLeads.filter(lead => 
        searchLeadsDto.region!.some(r => lead.region.toLowerCase() === r.toLowerCase())
      );
    }

    if (searchLeadsDto.minRevenue !== undefined) {
      filteredLeads = filteredLeads.filter(lead => lead.revenue >= searchLeadsDto.minRevenue!);
    }

    if (searchLeadsDto.maxRevenue !== undefined) {
      filteredLeads = filteredLeads.filter(lead => lead.revenue <= searchLeadsDto.maxRevenue!);
    }

    if (searchLeadsDto.growthRate !== undefined) {
      filteredLeads = filteredLeads.filter(lead => lead.growthRate >= searchLeadsDto.growthRate!);
    }

    if (searchLeadsDto.creditScore !== undefined) {
      filteredLeads = filteredLeads.filter(lead => lead.creditScore >= searchLeadsDto.creditScore!);
    }

    // Calculate average score
    const total = filteredLeads.length;
    const averageScore = total > 0
      ? filteredLeads.reduce((sum, lead) => sum + lead.score, 0) / total
      : 0;

    return {
      leads: filteredLeads,
      total,
      averageScore,
    };
  }
}
