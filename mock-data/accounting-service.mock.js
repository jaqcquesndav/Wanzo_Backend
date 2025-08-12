/**
 * Données de mock pour le accounting-service
 * Ces données sont conformes au modèle de données du microservice
 * et peuvent être utilisées pour initialiser la base de données
 */

const { v4: uuidv4 } = require('uuid');

// Enum constants from the entities
const JournalType = {
  GENERAL: 'general',
  SALES: 'sales',
  PURCHASES: 'purchases',
  BANK: 'bank',
  CASH: 'cash'
};

const JournalStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  POSTED: 'posted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

const JournalSource = {
  MANUAL: 'manual',
  AGENT: 'agent',
  IMPORT: 'import'
};

const ValidationStatus = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  REJECTED: 'rejected'
};

const FiscalYearStatus = {
  OPEN: 'open',
  CLOSED: 'closed',
  AUDITED: 'audited'
};

const AccountingMode = {
  SYSCOHADA: 'SYSCOHADA',
  IFRS: 'IFRS'
};

// Generate timestamps within the last year
function randomPastTimestamp(maxDaysAgo = 365) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.floor(Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000));
  return pastDate.toISOString();
}

// Helper function to generate a date between two dates
function randomDateBetween(startDate, endDate) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime).toISOString();
}

// Accounts Chart (based on SYSCOHADA)
const accountsChart = [
  { code: '101', name: 'Capital social' },
  { code: '106', name: 'Réserves' },
  { code: '108', name: 'Compte de l\'exploitant' },
  { code: '120', name: 'Résultat de l\'exercice' },
  { code: '211', name: 'Terrains' },
  { code: '212', name: 'Agencements et aménagements de terrains' },
  { code: '213', name: 'Constructions' },
  { code: '214', name: 'Installations techniques, matériel et outillage' },
  { code: '215', name: 'Matériel de transport' },
  { code: '216', name: 'Matériel de bureau et informatique' },
  { code: '218', name: 'Autres immobilisations corporelles' },
  { code: '231', name: 'Immobilisations corporelles en cours' },
  { code: '232', name: 'Immobilisations incorporelles en cours' },
  { code: '311', name: 'Marchandises A' },
  { code: '312', name: 'Marchandises B' },
  { code: '401', name: 'Fournisseurs' },
  { code: '409', name: 'Fournisseurs débiteurs' },
  { code: '411', name: 'Clients' },
  { code: '419', name: 'Clients créditeurs' },
  { code: '421', name: 'Personnel, avances et acomptes' },
  { code: '441', name: 'État, impôts et taxes' },
  { code: '511', name: 'Valeurs à encaisser' },
  { code: '521', name: 'Banques locales' },
  { code: '571', name: 'Caisse' },
  { code: '601', name: 'Achats de marchandises' },
  { code: '602', name: 'Achats de matières premières' },
  { code: '604', name: 'Achats d\'études et de prestations de services' },
  { code: '605', name: 'Achats de matériel, équipements et travaux' },
  { code: '607', name: 'Achats de marchandises à l\'étranger' },
  { code: '611', name: 'Transport sur achats' },
  { code: '612', name: 'Transport sur ventes' },
  { code: '621', name: 'Personnel extérieur à l\'entreprise' },
  { code: '622', name: 'Rémunérations d\'intermédiaires et honoraires' },
  { code: '623', name: 'Publicité, publications, relations publiques' },
  { code: '624', name: 'Transports de biens et transports collectifs du personnel' },
  { code: '625', name: 'Déplacements, missions et réceptions' },
  { code: '626', name: 'Frais postaux et frais de télécommunications' },
  { code: '631', name: 'Impôts et taxes directs' },
  { code: '632', name: 'Impôts et taxes indirects' },
  { code: '641', name: 'Frais de personnel' },
  { code: '701', name: 'Ventes de marchandises' },
  { code: '702', name: 'Ventes de produits finis' },
  { code: '704', name: 'Travaux et services vendus' },
  { code: '706', name: 'Services vendus à l\'étranger' },
  { code: '707', name: 'Ventes de marchandises à l\'étranger' }
];

// Generate a mock organization
function generateMockOrganization(id, name) {
  const orgId = id || uuidv4();
  const createdAt = randomPastTimestamp(200);
  
  return {
    id: orgId,
    name: name || `Organisation ${orgId.substring(0, 8)}`,
    entrepreneurName: Math.random() > 0.5 ? `Entrepreneur ${orgId.substring(0, 8)}` : null,
    associates: Math.random() > 0.5 ? `Associés de ${orgId.substring(0, 8)}` : null,
    registrationNumber: `RCCM/KIN/${Math.floor(Math.random() * 10000)}/${Math.floor(Math.random() * 10000)}`,
    taxId: `IDN${Math.floor(Math.random() * 10000000)}`,
    vatNumber: Math.random() > 0.3 ? `TVA${Math.floor(Math.random() * 10000000)}` : null,
    cnssNumber: Math.random() > 0.4 ? `CNSS${Math.floor(Math.random() * 1000000)}` : null,
    inppNumber: Math.random() > 0.4 ? `INPP${Math.floor(Math.random() * 1000000)}` : null,
    onemNumber: Math.random() > 0.4 ? `ONEM${Math.floor(Math.random() * 1000000)}` : null,
    address: `${Math.floor(Math.random() * 999) + 1} ${['Avenue', 'Boulevard', 'Rue'][Math.floor(Math.random() * 3)]} ${['Principale', 'du Commerce', 'des Affaires'][Math.floor(Math.random() * 3)]}`,
    city: ['Kinshasa', 'Lubumbashi', 'Goma', 'Bukavu'][Math.floor(Math.random() * 4)],
    country: 'République Démocratique du Congo',
    phone: `+243${Math.floor(800000000 + Math.random() * 199999999)}`,
    entrepreneurPhone: `+243${Math.floor(800000000 + Math.random() * 199999999)}`,
    email: `contact@org-${orgId.substring(0, 8)}.cd`,
    entrepreneurEmail: `entrepreneur@org-${orgId.substring(0, 8)}.cd`,
    website: Math.random() > 0.5 ? `https://www.org-${orgId.substring(0, 8)}.cd` : null,
    legalForm: ['SARL', 'SA', 'SPRL', 'Entreprise individuelle'][Math.floor(Math.random() * 4)],
    capital: Math.random() > 0.2 ? `${Math.floor(Math.random() * 100000000)} CDF` : null,
    currency: 'CDF',
    accountingMode: Math.random() > 0.3 ? AccountingMode.SYSCOHADA : AccountingMode.IFRS,
    logo: Math.random() > 0.6 ? `https://example.com/logos/org-${orgId.substring(0, 8)}.png` : null,
    industry: ['Commerce', 'Services', 'Manufacture', 'Agriculture', 'Mines'][Math.floor(Math.random() * 5)],
    description: `Organisation spécialisée dans ${['le commerce', 'les services', 'la manufacture', 'l\'agriculture', 'les mines'][Math.floor(Math.random() * 5)]}.`,
    createdAt: createdAt,
    updatedAt: randomPastTimestamp(50)
  };
}

// Generate a mock fiscal year
function generateMockFiscalYear(companyId) {
  const id = uuidv4();
  const currentYear = new Date().getFullYear();
  const startYear = Math.max(currentYear - 3, 2022); // Ne pas aller avant 2022
  const year = startYear + Math.floor(Math.random() * (currentYear - startYear + 1)); // Année entre startYear et currentYear
  
  const startDate = new Date(year, 0, 1); // 1er janvier de l'année
  const endDate = new Date(year, 11, 31); // 31 décembre de l'année
  const createdAt = new Date(year - 1, 11, 15); // Créé en décembre de l'année précédente
  
  // Si c'est l'année courante, le statut est OPEN, sinon c'est soit CLOSED soit AUDITED
  let status = FiscalYearStatus.OPEN;
  if (year < currentYear) {
    status = Math.random() > 0.3 ? FiscalYearStatus.CLOSED : FiscalYearStatus.AUDITED;
  }
  
  return {
    id: id,
    code: `FY-${year}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: status,
    auditStatus: status === FiscalYearStatus.AUDITED ? {
      isAudited: true,
      auditor: {
        name: `Cabinet d'Audit ${id.substring(0, 5)}`,
        registrationNumber: `REG-${Math.floor(Math.random() * 100000)}`
      },
      auditedAt: new Date(year + 1, 2, Math.floor(Math.random() * 15) + 1).toISOString() // Mars de l'année suivante
    } : null,
    companyId: companyId,
    createdBy: uuidv4(),
    createdAt: createdAt.toISOString(),
    updatedAt: new Date(createdAt.getTime() + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()
  };
}

// Generate mock journals
function generateMockJournals(fiscalYears, numberOfJournals = 20) {
  const journals = [];
  
  for (const fiscalYear of fiscalYears) {
    // Number of journals per fiscal year
    const journalsCount = Math.floor(Math.random() * numberOfJournals) + 5;
    const startDate = new Date(fiscalYear.startDate);
    const endDate = new Date(fiscalYear.endDate);
    
    for (let i = 0; i < journalsCount; i++) {
      const journalId = uuidv4();
      const journalDate = randomDateBetween(startDate, endDate);
      const createdDate = randomDateBetween(startDate, new Date(Math.min(endDate.getTime(), new Date().getTime())));
      
      // Select journal type
      const journalType = Object.values(JournalType)[Math.floor(Math.random() * Object.values(JournalType).length)];
      
      // Generate journal status based on fiscal year status
      let journalStatus = JournalStatus.DRAFT;
      if (fiscalYear.status === FiscalYearStatus.CLOSED || fiscalYear.status === FiscalYearStatus.AUDITED) {
        journalStatus = Math.random() > 0.1 ? JournalStatus.POSTED : JournalStatus.APPROVED;
      } else {
        // If fiscal year is open
        const statusChance = Math.random();
        if (statusChance < 0.3) {
          journalStatus = JournalStatus.DRAFT;
        } else if (statusChance < 0.5) {
          journalStatus = JournalStatus.PENDING;
        } else if (statusChance < 0.8) {
          journalStatus = JournalStatus.APPROVED;
        } else {
          journalStatus = JournalStatus.POSTED;
        }
      }
      
      // Generate validation status
      let validationStatus = null;
      let validatedBy = null;
      let validatedAt = null;
      
      if (journalStatus === JournalStatus.APPROVED || journalStatus === JournalStatus.POSTED) {
        validationStatus = ValidationStatus.VALIDATED;
        validatedBy = uuidv4();
        validatedAt = new Date(new Date(createdDate).getTime() + Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)).toISOString();
      } else if (journalStatus === JournalStatus.PENDING) {
        validationStatus = ValidationStatus.PENDING;
      } else if (journalStatus === JournalStatus.REJECTED) {
        validationStatus = ValidationStatus.REJECTED;
        validatedBy = uuidv4();
        validatedAt = new Date(new Date(createdDate).getTime() + Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)).toISOString();
      }
      
      // Generate random amount
      const totalAmount = Math.floor(Math.random() * 1000000) + 10000;
      
      const journal = {
        id: journalId,
        kiotaId: Math.random() > 0.7 ? `KIOTA-${Math.floor(Math.random() * 10000)}` : null,
        date: journalDate,
        journalType: journalType,
        description: `Journal de ${journalType} - ${new Date(journalDate).toLocaleDateString('fr-FR')}`,
        reference: `REF-${new Date(journalDate).toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000)}`,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        totalVat: Math.random() > 0.5 ? Math.floor(totalAmount * 0.16) : 0, // 16% VAT if applicable
        status: journalStatus,
        source: Math.random() > 0.8 ? JournalSource.IMPORT : Math.random() > 0.5 ? JournalSource.AGENT : JournalSource.MANUAL,
        agentId: Math.random() > 0.7 ? uuidv4() : null,
        validationStatus: validationStatus,
        validatedBy: validatedBy,
        validatedAt: validatedAt,
        postedBy: journalStatus === JournalStatus.POSTED ? uuidv4() : null,
        postedAt: journalStatus === JournalStatus.POSTED ? new Date(new Date(validatedAt || createdDate).getTime() + Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)).toISOString() : null,
        fiscalYearId: fiscalYear.id,
        organizationId: fiscalYear.companyId,
        createdBy: uuidv4(),
        createdAt: createdDate,
        updatedAt: new Date(new Date(createdDate).getTime() + Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)).toISOString()
      };
      
      journals.push(journal);
    }
  }
  
  return journals;
}

// Generate journal lines for journals
function generateJournalLines(journals) {
  const journalLines = [];
  
  journals.forEach(journal => {
    // Generate between 2 and 8 lines per journal
    const numLines = Math.floor(Math.random() * 7) + 2;
    const totalAmount = journal.totalDebit; // Equal to totalCredit
    
    // For a balanced journal: totalDebit = totalCredit
    let remainingDebit = totalAmount;
    let remainingCredit = totalAmount;
    
    for (let i = 0; i < numLines - 1; i++) {
      const isDebit = i % 2 === 0; // Alternate debit/credit entries
      const randomAccount = accountsChart[Math.floor(Math.random() * accountsChart.length)];
      let debitAmount = 0;
      let creditAmount = 0;
      
      if (isDebit) {
        debitAmount = Math.min(remainingDebit, Math.floor(Math.random() * (remainingDebit * 0.7) + remainingDebit * 0.1));
        remainingDebit -= debitAmount;
      } else {
        creditAmount = Math.min(remainingCredit, Math.floor(Math.random() * (remainingCredit * 0.7) + remainingCredit * 0.1));
        remainingCredit -= creditAmount;
      }
      
      const vatAmount = Math.random() > 0.7 && (randomAccount.code.startsWith('6') || randomAccount.code.startsWith('7')) ? Math.floor((isDebit ? debitAmount : creditAmount) * 0.16) : null;
      
      journalLines.push({
        id: uuidv4(),
        journalId: journal.id,
        accountId: uuidv4(),
        accountCode: randomAccount.code,
        accountName: randomAccount.name,
        debit: debitAmount,
        credit: creditAmount,
        description: `${isDebit ? 'Débit' : 'Crédit'} - ${randomAccount.name}`,
        vatCode: vatAmount ? 'TVA-16' : null,
        vatAmount: vatAmount,
        analyticCode: Math.random() > 0.7 ? `AN-${Math.floor(Math.random() * 100)}` : null,
        metadata: Math.random() > 0.8 ? { reference: `META-${Math.floor(Math.random() * 1000)}` } : null
      });
    }
    
    // Add final balancing entry
    const lastAccountIndex = Math.floor(Math.random() * accountsChart.length);
    const finalDebit = remainingDebit;
    const finalCredit = remainingCredit;
    
    journalLines.push({
      id: uuidv4(),
      journalId: journal.id,
      accountId: uuidv4(),
      accountCode: accountsChart[lastAccountIndex].code,
      accountName: accountsChart[lastAccountIndex].name,
      debit: finalDebit,
      credit: finalCredit,
      description: `Écriture d'équilibrage - ${accountsChart[lastAccountIndex].name}`,
      vatCode: null,
      vatAmount: null,
      analyticCode: null,
      metadata: null
    });
  });
  
  return journalLines;
}

// Generate journal attachments
function generateJournalAttachments(journals, probability = 0.3) {
  const attachments = [];
  
  journals.forEach(journal => {
    if (Math.random() < probability) {
      const numAttachments = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numAttachments; i++) {
        attachments.push({
          id: uuidv4(),
          journalId: journal.id,
          fileName: `attachment-${i + 1}-${journal.id.substring(0, 6)}.${['pdf', 'jpg', 'png'][Math.floor(Math.random() * 3)]}`,
          fileUrl: `https://example.com/attachments/${uuidv4()}.pdf`,
          fileType: ['application/pdf', 'image/jpeg', 'image/png'][Math.floor(Math.random() * 3)],
          fileSize: Math.floor(Math.random() * 5000000) + 100000, // Between 100KB and 5MB
          uploadedAt: new Date(new Date(journal.createdAt).getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
          uploadedBy: journal.createdBy
        });
      }
    }
  });
  
  return attachments;
}

// Generate mock data
const mockOrganizations = [
  generateMockOrganization(null, 'Société Kiota SARL'),
  generateMockOrganization(null, 'Entreprise de Démonstration SA'),
  generateMockOrganization()
];

// Generate fiscal years for each organization
const mockFiscalYears = [];
mockOrganizations.forEach(org => {
  const numYears = Math.floor(Math.random() * 3) + 1; // 1-3 years per organization
  for (let i = 0; i < numYears; i++) {
    mockFiscalYears.push(generateMockFiscalYear(org.id));
  }
});

// Generate journals for each fiscal year
const mockJournals = generateMockJournals(mockFiscalYears);

// Generate journal lines for each journal
const mockJournalLines = generateJournalLines(mockJournals);

// Generate attachments for some journals
const mockJournalAttachments = generateJournalAttachments(mockJournals);

module.exports = {
  organizations: mockOrganizations,
  fiscalYears: mockFiscalYears,
  journals: mockJournals,
  journalLines: mockJournalLines,
  journalAttachments: mockJournalAttachments,
  // Export helper functions for use in other mock files if needed
  helpers: {
    generateMockOrganization,
    generateMockFiscalYear,
    generateMockJournals,
    generateJournalLines,
    generateJournalAttachments,
    randomPastTimestamp,
    randomDateBetween,
    accountsChart
  }
};
