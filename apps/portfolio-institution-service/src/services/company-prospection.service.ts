import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProspectDto, UpdateProspectDto, ProspectResponseDto, ProspectQueryDto } from '../dto/prospect.dto';

/**
 * Service de gestion de la prospection d'entreprises
 * Mock implementation pour le développement
 */
@Injectable()
export class CompanyProspectionService {

  /**
   * Créer un nouveau prospect
   */
  async create(createDto: CreateProspectDto): Promise<ProspectResponseDto> {
    // Mock implementation
    const mockProspect: ProspectResponseDto = {
      id: `prospect_${Date.now()}`,
      companyName: createDto.companyName,
      industry: createDto.industry,
      size: createDto.size,
      revenue: createDto.revenue,
      contactEmail: createDto.contactEmail,
      contactPhone: createDto.contactPhone,
      contactPerson: createDto.contactPerson,
      address: createDto.address,
      status: 'new',
      priority: createDto.priority || 'medium',
      source: createDto.source || 'manual',
      assignedTo: createDto.assignedTo,
      notes: createDto.notes || '',
      tags: createDto.tags || [],
      lastContactDate: null,
      nextFollowUpDate: createDto.nextFollowUpDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return mockProspect;
  }

  /**
   * Récupérer tous les prospects avec filtres
   */
  async findAll(query: ProspectQueryDto = {}): Promise<{
    prospects: ProspectResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Mock implementation
    const mockProspects: ProspectResponseDto[] = [
      {
        id: 'prospect_1',
        companyName: 'TechCorp SA',
        industry: 'technology',
        size: 'medium',
        revenue: 5000000,
        contactEmail: 'contact@techcorp.cd',
        contactPhone: '+243815551234',
        contactPerson: 'Jean Mukendi',
        address: 'Kinshasa, RDC',
        status: 'contacted',
        priority: 'high',
        source: 'referral',
        assignedTo: 'analyst_1',
        notes: 'Société technologique prometteuse avec forte croissance',
        tags: ['tech', 'croissance'],
        lastContactDate: new Date(Date.now() - 86400000 * 3),
        nextFollowUpDate: new Date(Date.now() + 86400000 * 7),
        createdAt: new Date(Date.now() - 86400000 * 10),
        updatedAt: new Date(Date.now() - 86400000 * 3)
      },
      {
        id: 'prospect_2',
        companyName: 'MineCorp SARL',
        industry: 'mining',
        size: 'large',
        revenue: 25000000,
        contactEmail: 'info@minecorp.cd',
        contactPhone: '+243815555678',
        contactPerson: 'Marie Kasongo',
        address: 'Lubumbashi, RDC',
        status: 'qualified',
        priority: 'high',
        source: 'website',
        assignedTo: 'analyst_2',
        notes: 'Grande société minière, bon potentiel de financement',
        tags: ['mining', 'large'],
        lastContactDate: new Date(Date.now() - 86400000 * 1),
        nextFollowUpDate: new Date(Date.now() + 86400000 * 3),
        createdAt: new Date(Date.now() - 86400000 * 20),
        updatedAt: new Date(Date.now() - 86400000 * 1)
      }
    ];

    // Apply basic filtering
    let filteredProspects = mockProspects;
    
    if (query.status) {
      filteredProspects = filteredProspects.filter(p => p.status === query.status);
    }
    
    if (query.industry) {
      filteredProspects = filteredProspects.filter(p => p.industry === query.industry);
    }
    
    if (query.priority) {
      filteredProspects = filteredProspects.filter(p => p.priority === query.priority);
    }
    
    if (query.assignedTo) {
      filteredProspects = filteredProspects.filter(p => p.assignedTo === query.assignedTo);
    }

    const limit = query.limit || 10;
    const page = query.page || 1;
    const start = (page - 1) * limit;
    const paginatedProspects = filteredProspects.slice(start, start + limit);

    return {
      prospects: paginatedProspects,
      total: filteredProspects.length,
      page,
      limit
    };
  }

  /**
   * Récupérer un prospect par ID
   */
  async findOne(id: string): Promise<ProspectResponseDto> {
    if (!id || id === 'non-existent') {
      throw new NotFoundException(`Prospect avec l'ID ${id} non trouvé`);
    }

    // Mock implementation
    const mockProspect: ProspectResponseDto = {
      id,
      companyName: 'Example Corp',
      industry: 'services',
      size: 'small',
      revenue: 1000000,
      contactEmail: 'contact@example.cd',
      contactPhone: '+243815554321',
      contactPerson: 'Pierre Kambale',
      address: 'Kinshasa, RDC',
      status: 'new',
      priority: 'medium',
      source: 'manual',
      assignedTo: 'analyst_1',
      notes: 'Nouveau prospect identifié via recherche manuelle',
      tags: ['services'],
      lastContactDate: null,
      nextFollowUpDate: new Date(Date.now() + 86400000 * 7),
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000 * 5)
    };

    return mockProspect;
  }

  /**
   * Mettre à jour un prospect
   */
  async update(id: string, updateDto: UpdateProspectDto): Promise<ProspectResponseDto> {
    const existingProspect = await this.findOne(id);

    // Mock implementation
    const updatedProspect: ProspectResponseDto = {
      ...existingProspect,
      ...updateDto,
      updatedAt: new Date()
    };

    return updatedProspect;
  }

  /**
   * Supprimer un prospect
   */
  async remove(id: string): Promise<void> {
    const existingProspect = await this.findOne(id);
    console.log(`Prospect ${existingProspect.companyName} supprimé avec succès`);
  }

  /**
   * Changer le statut d'un prospect
   */
  async changeStatus(id: string, status: string, notes?: string): Promise<ProspectResponseDto> {
    const existingProspect = await this.findOne(id);
    
    // Validate status
    const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide: ${status}`);
    }

    const updatedProspect: ProspectResponseDto = {
      ...existingProspect,
      status,
      notes: notes ? `${existingProspect.notes}\n\n${new Date().toISOString()}: ${notes}` : existingProspect.notes,
      lastContactDate: new Date(),
      updatedAt: new Date()
    };

    return updatedProspect;
  }

  /**
   * Assigner un prospect à un analyste
   */
  async assign(id: string, assignedTo: string): Promise<ProspectResponseDto> {
    const existingProspect = await this.findOne(id);
    
    const updatedProspect: ProspectResponseDto = {
      ...existingProspect,
      assignedTo,
      updatedAt: new Date()
    };

    return updatedProspect;
  }

  /**
   * Ajouter des notes à un prospect
   */
  async addNotes(id: string, notes: string): Promise<ProspectResponseDto> {
    const existingProspect = await this.findOne(id);
    
    const updatedProspect: ProspectResponseDto = {
      ...existingProspect,
      notes: `${existingProspect.notes}\n\n${new Date().toISOString()}: ${notes}`,
      updatedAt: new Date()
    };

    return updatedProspect;
  }

  /**
   * Récupérer les statistiques de prospection
   */
  async getStats(): Promise<{
    totalProspects: number;
    byStatus: Record<string, number>;
    byIndustry: Record<string, number>;
    byPriority: Record<string, number>;
    recentProspects: number;
    conversionRate: number;
  }> {
    const { prospects } = await this.findAll({ limit: 1000 });
    
    const stats = {
      totalProspects: prospects.length,
      byStatus: prospects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byIndustry: prospects.reduce((acc, p) => {
        acc[p.industry] = (acc[p.industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: prospects.reduce((acc, p) => {
        acc[p.priority] = (acc[p.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentProspects: prospects.filter(p => 
        p.createdAt > new Date(Date.now() - 86400000 * 30)
      ).length,
      conversionRate: prospects.length > 0 ? 
        (prospects.filter(p => p.status === 'closed_won').length / prospects.length) * 100 : 0
    };

    return stats;
  }

  /**
   * Recherche textuelle dans les prospects
   */
  async search(searchTerm: string): Promise<ProspectResponseDto[]> {
    const { prospects } = await this.findAll({ limit: 1000 });
    
    const searchTermLower = searchTerm.toLowerCase();
    const filteredProspects = prospects.filter(p => 
      p.companyName.toLowerCase().includes(searchTermLower) ||
      p.contactPerson.toLowerCase().includes(searchTermLower) ||
      p.contactEmail.toLowerCase().includes(searchTermLower) ||
      p.industry.toLowerCase().includes(searchTermLower) ||
      p.notes.toLowerCase().includes(searchTermLower)
    );

    return filteredProspects;
  }

  /**
   * Ajouter une entreprise prospectable
   */
  async addProspectableCompany(companyData: any): Promise<any> {
    const prospect = await this.create(companyData);
    return prospect;
  }

  /**
   * Import en lot d'entreprises
   */
  async bulkImportCompanies(companiesData: any[]): Promise<any> {
    const importedCompanies: any[] = [];
    
    for (const companyData of companiesData) {
      const company = await this.create(companyData);
      importedCompanies.push(company);
    }

    return {
      success: true,
      imported: importedCompanies.length,
      companies: importedCompanies,
      errors: []
    };
  }

  /**
   * Évaluation des risques d'une entreprise
   */
  async performRiskAssessment(companyId: string, assessmentData: any): Promise<any> {
    const company = await this.findOne(companyId);
    
    // Mock risk assessment
    const assessment = {
      companyId,
      riskLevel: 'medium',
      riskScore: 0.45,
      factors: [
        { factor: 'Stabilité financière', score: 0.7, weight: 0.3 },
        { factor: 'Secteur d\'activité', score: 0.6, weight: 0.2 },
        { factor: 'Historique de paiement', score: 0.8, weight: 0.3 },
        { factor: 'Taille de l\'entreprise', score: 0.5, weight: 0.2 }
      ],
      recommendations: [
        'Demander des garanties supplémentaires',
        'Surveiller la situation financière mensuellement'
      ],
      assessmentDate: new Date()
    };

    return assessment;
  }

  /**
   * Calcul du score de crédit
   */
  async calculateCreditScore(companyId: string, scoringData: any): Promise<any> {
    const company = await this.findOne(companyId);
    
    // Mock credit scoring
    const creditScore = {
      companyId,
      score: 750,
      grade: 'B+',
      factors: {
        paymentHistory: 85,
        creditUtilization: 65,
        creditHistory: 90,
        creditMix: 70,
        newCredit: 80
      },
      recommendation: 'Crédit accordable avec conditions standard',
      validUntil: new Date(Date.now() + 86400000 * 90) // 90 days
    };

    return creditScore;
  }

  /**
   * Simulation de prêt
   */
  async simulateLoan(companyId: string, loanData: any): Promise<any> {
    // Mock loan simulation
    const simulation = {
      loanAmount: loanData.amount || 100000,
      interestRate: 5.5,
      termMonths: loanData.termMonths || 36,
      monthlyPayment: 3180,
      totalInterest: 14480,
      totalPayment: 114480,
      schedule: [
        { month: 1, payment: 3180, principal: 2471, interest: 709, balance: 97529 },
        { month: 2, payment: 3180, principal: 2492, interest: 688, balance: 95037 }
      ],
      eligibility: 'approved',
      conditions: ['Garantie requise', 'Assurance obligatoire']
    };

    return simulation;
  }

  /**
   * Traitement d'une demande de crédit
   */
  async processCreditApplication(companyId: string, applicationData: any): Promise<any> {
    // Mock application processing
    const application = {
      applicationId: `app_${Date.now()}`,
      companyId: applicationData.companyId,
      amount: applicationData.amount,
      status: 'under_review',
      submittedAt: new Date(),
      estimatedDecisionDate: new Date(Date.now() + 86400000 * 7),
      documents: applicationData.documents || [],
      nextSteps: [
        'Vérification des documents',
        'Analyse financière',
        'Décision finale'
      ]
    };

    return application;
  }

  /**
   * Récupérer les entreprises prospectables
   */
  async getProspectableCompanies(query: any = {}): Promise<any> {
    return await this.findAll(query);
  }

  /**
   * Détails d'une entreprise
   */
  async getCompanyDetails(companyId: string): Promise<any> {
    return await this.findOne(companyId);
  }

  /**
   * Mettre à jour une entreprise
   */
  async updateCompany(companyId: string, updateData: any): Promise<any> {
    return await this.update(companyId, updateData);
  }

  /**
   * Supprimer une entreprise
   */
  async removeCompany(companyId: string): Promise<void> {
    return await this.remove(companyId);
  }

  /**
   * Rapport de prospection
   */
  async generateProspectionReport(params: any = {}): Promise<any> {
    const stats = await this.getStats();
    
    const report = {
      ...stats,
      period: params.period || 'monthly',
      topProspects: [
        { companyName: 'TechCorp SA', score: 95, status: 'qualified' },
        { companyName: 'MineCorp SARL', score: 89, status: 'contacted' }
      ],
      recommendations: [
        'Intensifier les efforts sur le secteur technologique',
        'Développer la prospection dans le secteur minier'
      ],
      generatedAt: new Date()
    };

    return report;
  }

  /**
   * Analyse du portefeuille
   */
  async generatePortfolioAnalysis(params: any = {}): Promise<any> {
    const { prospects } = await this.findAll({ limit: 1000 });
    
    const analysis = {
      totalValue: prospects.reduce((sum, p) => sum + (p.revenue || 0), 0),
      portfolioSize: prospects.length,
      diversification: {
        byIndustry: prospects.reduce((acc, p) => {
          acc[p.industry] = (acc[p.industry] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bySize: prospects.reduce((acc, p) => {
          acc[p.size] = (acc[p.size] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      riskProfile: 'balanced',
      performanceMetrics: {
        conversionRate: 15.5,
        averageDealSize: 250000,
        timeToClose: 45
      },
      recommendations: [
        'Augmenter la diversification sectorielle',
        'Se concentrer sur les PME à fort potentiel'
      ]
    };

    return analysis;
  }
}