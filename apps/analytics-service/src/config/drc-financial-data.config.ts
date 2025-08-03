import { Province, EconomicSector, FinancialInstitution, RiskThreshold, CurrencyConfig, AnalyticsConstants } from './data-types';

/**
 * Configuration centralisée des données de référence pour la RDC
 * Cette configuration contient toutes les données statiques utilisées dans le système d'analyse des risques
 */

// ====================
// DONNÉES GÉOGRAPHIQUES RDC
// ====================
export const DRC_PROVINCES: Province[] = [
  {
    id: 'geo-kinshasa',
    name: 'Kinshasa',
    code: 'KIN',
    riskScore: 4.8,
    population: 15000000,
    economicIndicators: {
      gdpContribution: 25.0,
      businessDensity: 85.2,
      financialInclusion: 60.5
    },
    coordinates: {
      latitude: -4.4419,
      longitude: 15.2663
    },
    capital: 'Kinshasa',
    surface: 9965,
    density: 1505
  },
  {
    id: 'geo-katanga',
    name: 'Katanga',
    code: 'KAT',
    riskScore: 6.1,
    population: 8500000,
    economicIndicators: {
      gdpContribution: 20.1,
      businessDensity: 70.3,
      financialInclusion: 45.2
    },
    coordinates: {
      latitude: -10.6897,
      longitude: 25.8478
    },
    capital: 'Lubumbashi',
    surface: 518000,
    density: 16.4
  },
  {
    id: 'geo-kasai',
    name: 'Kasaï',
    code: 'KAS',
    riskScore: 5.9,
    population: 6200000,
    economicIndicators: {
      gdpContribution: 15.2,
      businessDensity: 55.8,
      financialInclusion: 35.1
    },
    coordinates: {
      latitude: -5.8906,
      longitude: 22.4056
    },
    capital: 'Kananga',
    surface: 154742,
    density: 40.1
  },
  {
    id: 'geo-nord-kivu',
    name: 'Nord-Kivu',
    code: 'NKV',
    riskScore: 7.2,
    population: 4800000,
    economicIndicators: {
      gdpContribution: 8.1,
      businessDensity: 40.2,
      financialInclusion: 25.3
    },
    coordinates: {
      latitude: -0.7167,
      longitude: 29.2333
    },
    capital: 'Goma',
    surface: 59631,
    density: 80.5
  },
  {
    id: 'geo-sud-kivu',
    name: 'Sud-Kivu',
    code: 'SKV',
    riskScore: 6.8,
    population: 4100000,
    economicIndicators: {
      gdpContribution: 7.2,
      businessDensity: 38.5,
      financialInclusion: 22.8
    },
    coordinates: {
      latitude: -2.5085,
      longitude: 28.8608
    },
    capital: 'Bukavu',
    surface: 65070,
    density: 63.0
  },
  {
    id: 'geo-kongo-central',
    name: 'Kongo Central',
    code: 'KOC',
    riskScore: 5.4,
    population: 3600000,
    economicIndicators: {
      gdpContribution: 12.3,
      businessDensity: 60.1,
      financialInclusion: 45.7
    },
    coordinates: {
      latitude: -5.1211,
      longitude: 14.7818
    },
    capital: 'Matadi',
    surface: 53920,
    density: 66.8
  },
  {
    id: 'geo-equateur',
    name: 'Équateur',
    code: 'EQU',
    riskScore: 6.4,
    population: 3200000,
    economicIndicators: {
      gdpContribution: 8.5,
      businessDensity: 35.2,
      financialInclusion: 30.1
    },
    coordinates: {
      latitude: 0.7731,
      longitude: 18.0664
    },
    capital: 'Mbandaka',
    surface: 403292,
    density: 7.9
  },
  {
    id: 'geo-tshopo',
    name: 'Tshopo',
    code: 'TSH',
    riskScore: 6.6,
    population: 2900000,
    economicIndicators: {
      gdpContribution: 9.1,
      businessDensity: 40.8,
      financialInclusion: 28.5
    },
    coordinates: {
      latitude: 0.5167,
      longitude: 25.1833
    },
    capital: 'Kisangani',
    surface: 199567,
    density: 14.5
  },
  {
    id: 'geo-haut-katanga',
    name: 'Haut-Katanga',
    code: 'HKA',
    riskScore: 6.0,
    population: 3800000,
    economicIndicators: {
      gdpContribution: 18.5,
      businessDensity: 65.3,
      financialInclusion: 42.1
    },
    coordinates: {
      latitude: -11.6574,
      longitude: 27.4794
    },
    capital: 'Lubumbashi',
    surface: 132425,
    density: 28.7
  },
  {
    id: 'geo-lualaba',
    name: 'Lualaba',
    code: 'LUA',
    riskScore: 6.3,
    population: 2300000,
    economicIndicators: {
      gdpContribution: 14.2,
      businessDensity: 45.8,
      financialInclusion: 38.4
    },
    coordinates: {
      latitude: -10.5467,
      longitude: 25.6575
    },
    capital: 'Kolwezi',
    surface: 121308,
    density: 19.0
  },
  {
    id: 'geo-haut-lomami',
    name: 'Haut-Lomami',
    code: 'HLO',
    riskScore: 6.7,
    population: 2100000,
    economicIndicators: {
      gdpContribution: 6.8,
      businessDensity: 32.1,
      financialInclusion: 28.9
    },
    coordinates: {
      latitude: -9.0000,
      longitude: 25.5000
    },
    capital: 'Kamina',
    surface: 108204,
    density: 19.4
  },
  {
    id: 'geo-tanganyika',
    name: 'Tanganyika',
    code: 'TAN',
    riskScore: 7.1,
    population: 2800000,
    economicIndicators: {
      gdpContribution: 5.9,
      businessDensity: 28.7,
      financialInclusion: 24.3
    },
    coordinates: {
      latitude: -6.7833,
      longitude: 29.1333
    },
    capital: 'Kalemie',
    surface: 134940,
    density: 20.7
  },
  {
    id: 'geo-ituri',
    name: 'Ituri',
    code: 'ITU',
    riskScore: 7.5,
    population: 4200000,
    economicIndicators: {
      gdpContribution: 6.2,
      businessDensity: 31.4,
      financialInclusion: 21.8
    },
    coordinates: {
      latitude: 1.6500,
      longitude: 30.8333
    },
    capital: 'Bunia',
    surface: 65658,
    density: 64.0
  },
  {
    id: 'geo-bas-uele',
    name: 'Bas-Uélé',
    code: 'BUE',
    riskScore: 6.9,
    population: 1800000,
    economicIndicators: {
      gdpContribution: 3.1,
      businessDensity: 22.5,
      financialInclusion: 18.7
    },
    coordinates: {
      latitude: 3.7167,
      longitude: 23.7833
    },
    capital: 'Buta',
    surface: 148331,
    density: 12.1
  },
  {
    id: 'geo-haut-uele',
    name: 'Haut-Uélé',
    code: 'HUE',
    riskScore: 7.0,
    population: 1600000,
    economicIndicators: {
      gdpContribution: 2.8,
      businessDensity: 19.8,
      financialInclusion: 16.5
    },
    coordinates: {
      latitude: 4.0000,
      longitude: 28.4500
    },
    capital: 'Isiro',
    surface: 89683,
    density: 17.8
  },
  {
    id: 'geo-maniema',
    name: 'Maniema',
    code: 'MAN',
    riskScore: 6.5,
    population: 2300000,
    economicIndicators: {
      gdpContribution: 4.3,
      businessDensity: 26.9,
      financialInclusion: 23.1
    },
    coordinates: {
      latitude: -4.0000,
      longitude: 26.0000
    },
    capital: 'Kindu',
    surface: 132250,
    density: 17.4
  },
  {
    id: 'geo-sankuru',
    name: 'Sankuru',
    code: 'SAN',
    riskScore: 6.8,
    population: 1900000,
    economicIndicators: {
      gdpContribution: 3.5,
      businessDensity: 24.2,
      financialInclusion: 20.6
    },
    coordinates: {
      latitude: -3.2167,
      longitude: 23.6000
    },
    capital: 'Lusambo',
    surface: 104331,
    density: 18.2
  },
  {
    id: 'geo-lomami',
    name: 'Lomami',
    code: 'LOM',
    riskScore: 6.4,
    population: 2200000,
    economicIndicators: {
      gdpContribution: 4.1,
      businessDensity: 27.8,
      financialInclusion: 25.3
    },
    coordinates: {
      latitude: -6.1500,
      longitude: 24.4833
    },
    capital: 'Kabinda',
    surface: 56426,
    density: 39.0
  },
  {
    id: 'geo-kasai-central',
    name: 'Kasaï Central',
    code: 'KCE',
    riskScore: 5.8,
    population: 3400000,
    economicIndicators: {
      gdpContribution: 7.9,
      businessDensity: 41.2,
      financialInclusion: 32.8
    },
    coordinates: {
      latitude: -5.8906,
      longitude: 22.4056
    },
    capital: 'Kananga',
    surface: 59111,
    density: 57.5
  },
  {
    id: 'geo-kasai-oriental',
    name: 'Kasaï Oriental',
    code: 'KOR',
    riskScore: 6.1,
    population: 2700000,
    economicIndicators: {
      gdpContribution: 5.6,
      businessDensity: 33.4,
      financialInclusion: 29.1
    },
    coordinates: {
      latitude: -6.1319,
      longitude: 23.5975
    },
    capital: 'Mbuji-Mayi',
    surface: 9545,
    density: 282.8
  },
  {
    id: 'geo-kwango',
    name: 'Kwango',
    code: 'KWA',
    riskScore: 6.6,
    population: 1800000,
    economicIndicators: {
      gdpContribution: 3.2,
      businessDensity: 23.7,
      financialInclusion: 21.4
    },
    coordinates: {
      latitude: -5.9333,
      longitude: 16.8167
    },
    capital: 'Kenge',
    surface: 89974,
    density: 20.0
  },
  {
    id: 'geo-kwilu',
    name: 'Kwilu',
    code: 'KWI',
    riskScore: 6.2,
    population: 5100000,
    economicIndicators: {
      gdpContribution: 8.7,
      businessDensity: 37.1,
      financialInclusion: 31.6
    },
    coordinates: {
      latitude: -4.3333,
      longitude: 19.0000
    },
    capital: 'Bandundu',
    surface: 78219,
    density: 65.2
  },
  {
    id: 'geo-mai-ndombe',
    name: 'Mai-Ndombe',
    code: 'MAI',
    riskScore: 6.9,
    population: 1800000,
    economicIndicators: {
      gdpContribution: 2.9,
      businessDensity: 18.4,
      financialInclusion: 17.2
    },
    coordinates: {
      latitude: -2.3000,
      longitude: 17.5000
    },
    capital: 'Inongo',
    surface: 127465,
    density: 14.1
  },
  {
    id: 'geo-mongala',
    name: 'Mongala',
    code: 'MON',
    riskScore: 7.1,
    population: 1400000,
    economicIndicators: {
      gdpContribution: 2.1,
      businessDensity: 16.8,
      financialInclusion: 15.9
    },
    coordinates: {
      latitude: 1.8500,
      longitude: 19.6000
    },
    capital: 'Lisala',
    surface: 58141,
    density: 24.1
  },
  {
    id: 'geo-nord-ubangi',
    name: 'Nord-Ubangi',
    code: 'NUB',
    riskScore: 7.3,
    population: 1200000,
    economicIndicators: {
      gdpContribution: 1.8,
      businessDensity: 14.2,
      financialInclusion: 13.5
    },
    coordinates: {
      latitude: 4.2000,
      longitude: 21.0000
    },
    capital: 'Gbadolite',
    surface: 56644,
    density: 21.2
  },
  {
    id: 'geo-sud-ubangi',
    name: 'Sud-Ubangi',
    code: 'SUB',
    riskScore: 6.7,
    population: 2800000,
    economicIndicators: {
      gdpContribution: 4.2,
      businessDensity: 25.3,
      financialInclusion: 22.8
    },
    coordinates: {
      latitude: 2.7000,
      longitude: 18.6000
    },
    capital: 'Gemena',
    surface: 51648,
    density: 54.2
  },
  {
    id: 'geo-tshuapa',
    name: 'Tshuapa',
    code: 'TSU',
    riskScore: 7.0,
    population: 1300000,
    economicIndicators: {
      gdpContribution: 1.9,
      businessDensity: 15.6,
      financialInclusion: 14.8
    },
    coordinates: {
      latitude: -1.0000,
      longitude: 20.5000
    },
    capital: 'Boende',
    surface: 132957,
    density: 9.8
  }
];

// ====================
// SECTEURS ÉCONOMIQUES
// ====================
export const ECONOMIC_SECTORS: EconomicSector[] = [
  {
    id: 'sec-mining',
    name: 'Exploitation minière',
    code: 'MIN',
    riskLevel: 'HIGH',
    defaultRate: 12.5,
    growthRate: 5.2,
    totalSMEs: 450,
    avgRevenue: 2500000,
    volatility: 8.5,
    seasonality: false,
    regulatoryRisk: 7.8
  },
  {
    id: 'sec-agriculture',
    name: 'Agriculture et élevage',
    code: 'AGR',
    riskLevel: 'MEDIUM',
    defaultRate: 8.3,
    growthRate: 3.8,
    totalSMEs: 2800,
    avgRevenue: 450000,
    volatility: 6.2,
    seasonality: true,
    regulatoryRisk: 4.5
  },
  {
    id: 'sec-commerce',
    name: 'Commerce de détail',
    code: 'COM',
    riskLevel: 'MEDIUM',
    defaultRate: 9.1,
    growthRate: 4.2,
    totalSMEs: 3200,
    avgRevenue: 680000,
    volatility: 5.8,
    seasonality: true,
    regulatoryRisk: 5.2
  },
  {
    id: 'sec-transport',
    name: 'Transport et logistique',
    code: 'TRA',
    riskLevel: 'MEDIUM',
    defaultRate: 10.2,
    growthRate: 3.5,
    totalSMEs: 850,
    avgRevenue: 920000,
    volatility: 7.1,
    seasonality: false,
    regulatoryRisk: 6.8
  },
  {
    id: 'sec-manufacturing',
    name: 'Industrie manufacturière',
    code: 'MAN',
    riskLevel: 'MEDIUM',
    defaultRate: 7.8,
    growthRate: 4.8,
    totalSMEs: 650,
    avgRevenue: 1200000,
    volatility: 6.5,
    seasonality: false,
    regulatoryRisk: 5.9
  },
  {
    id: 'sec-services',
    name: 'Services aux entreprises',
    code: 'SER',
    riskLevel: 'LOW',
    defaultRate: 6.2,
    growthRate: 6.1,
    totalSMEs: 1800,
    avgRevenue: 380000,
    volatility: 4.2,
    seasonality: false,
    regulatoryRisk: 3.8
  },
  {
    id: 'sec-telecommunications',
    name: 'Télécommunications',
    code: 'TEL',
    riskLevel: 'LOW',
    defaultRate: 4.1,
    growthRate: 8.5,
    totalSMEs: 120,
    avgRevenue: 3500000,
    volatility: 5.5,
    seasonality: false,
    regulatoryRisk: 6.2
  },
  {
    id: 'sec-energy',
    name: 'Énergie et services publics',
    code: 'ENE',
    riskLevel: 'HIGH',
    defaultRate: 14.2,
    growthRate: 2.8,
    totalSMEs: 95,
    avgRevenue: 5200000,
    volatility: 9.2,
    seasonality: false,
    regulatoryRisk: 8.5
  },
  {
    id: 'sec-construction',
    name: 'BTP et construction',
    code: 'CON',
    riskLevel: 'HIGH',
    defaultRate: 11.8,
    growthRate: 4.1,
    totalSMEs: 720,
    avgRevenue: 1800000,
    volatility: 8.1,
    seasonality: true,
    regulatoryRisk: 6.5
  },
  {
    id: 'sec-healthcare',
    name: 'Santé et services sociaux',
    code: 'HEA',
    riskLevel: 'LOW',
    defaultRate: 5.5,
    growthRate: 5.8,
    totalSMEs: 420,
    avgRevenue: 650000,
    volatility: 3.8,
    seasonality: false,
    regulatoryRisk: 4.2
  },
  {
    id: 'sec-education',
    name: 'Éducation et formation',
    code: 'EDU',
    riskLevel: 'LOW',
    defaultRate: 4.8,
    growthRate: 6.5,
    totalSMEs: 380,
    avgRevenue: 420000,
    volatility: 3.2,
    seasonality: true,
    regulatoryRisk: 3.5
  },
  {
    id: 'sec-tourism',
    name: 'Tourisme et hôtellerie',
    code: 'TOU',
    riskLevel: 'MEDIUM',
    defaultRate: 13.5,
    growthRate: 2.1,
    totalSMEs: 280,
    avgRevenue: 890000,
    volatility: 9.8,
    seasonality: true,
    regulatoryRisk: 5.8
  },
  {
    id: 'sec-finance',
    name: 'Services financiers',
    code: 'FIN',
    riskLevel: 'MEDIUM',
    defaultRate: 6.8,
    growthRate: 7.2,
    totalSMEs: 150,
    avgRevenue: 2100000,
    volatility: 6.8,
    seasonality: false,
    regulatoryRisk: 8.9
  },
  {
    id: 'sec-technology',
    name: 'Technologies de l\'information',
    code: 'TEC',
    riskLevel: 'LOW',
    defaultRate: 5.2,
    growthRate: 12.8,
    totalSMEs: 95,
    avgRevenue: 1800000,
    volatility: 7.5,
    seasonality: false,
    regulatoryRisk: 4.8
  }
];

// ====================
// INSTITUTIONS FINANCIÈRES
// ====================
export const FINANCIAL_INSTITUTIONS: FinancialInstitution[] = [
  {
    id: 'inst-bcc',
    name: 'Banque Centrale du Congo',
    type: 'CENTRAL_BANK',
    license: 'BCC-001',
    riskScore: 2.1,
    totalAssets: 8500000000,
    capitalRatio: 95.2,
    foundedYear: 1964,
    headquarters: 'Kinshasa',
    employeeCount: 2500,
    branchCount: 12,
    isSystemicallyImportant: true
  },
  {
    id: 'inst-rawbank',
    name: 'Rawbank',
    type: 'COMMERCIAL_BANK',
    license: 'CB-001',
    riskScore: 4.2,
    totalAssets: 2800000000,
    capitalRatio: 18.5,
    foundedYear: 2002,
    headquarters: 'Kinshasa',
    employeeCount: 1800,
    branchCount: 45,
    isSystemicallyImportant: true
  },
  {
    id: 'inst-equity',
    name: 'Equity Bank DRC',
    type: 'COMMERCIAL_BANK',
    license: 'CB-015',
    riskScore: 3.8,
    totalAssets: 1500000000,
    capitalRatio: 22.1,
    foundedYear: 2014,
    headquarters: 'Kinshasa',
    employeeCount: 950,
    branchCount: 28,
    isSystemicallyImportant: true
  },
  {
    id: 'inst-trust',
    name: 'Trust Merchant Bank',
    type: 'COMMERCIAL_BANK',
    license: 'CB-008',
    riskScore: 4.5,
    totalAssets: 980000000,
    capitalRatio: 19.8,
    foundedYear: 1983,
    headquarters: 'Kinshasa',
    employeeCount: 780,
    branchCount: 22,
    isSystemicallyImportant: false
  },
  {
    id: 'inst-procredit',
    name: 'ProCredit Bank DRC',
    type: 'COMMERCIAL_BANK',
    license: 'CB-012',
    riskScore: 3.9,
    totalAssets: 650000000,
    capitalRatio: 21.5,
    foundedYear: 2010,
    headquarters: 'Kinshasa',
    employeeCount: 620,
    branchCount: 18,
    isSystemicallyImportant: false
  },
  {
    id: 'inst-finca',
    name: 'FINCA DRC',
    type: 'MICROFINANCE',
    license: 'MF-005',
    riskScore: 5.2,
    totalAssets: 85000000,
    capitalRatio: 15.8,
    foundedYear: 2009,
    headquarters: 'Kinshasa',
    employeeCount: 420,
    branchCount: 35,
    isSystemicallyImportant: false
  },
  {
    id: 'inst-hope',
    name: 'HOPE DRC',
    type: 'MICROFINANCE',
    license: 'MF-012',
    riskScore: 4.9,
    totalAssets: 45000000,
    capitalRatio: 16.2,
    foundedYear: 2011,
    headquarters: 'Kinshasa',
    employeeCount: 280,
    branchCount: 25,
    isSystemicallyImportant: false
  },
  {
    id: 'inst-mecredit',
    name: 'Mecredit',
    type: 'MICROFINANCE',
    license: 'MF-008',
    riskScore: 5.8,
    totalAssets: 32000000,
    capitalRatio: 14.5,
    foundedYear: 2008,
    headquarters: 'Lubumbashi',
    employeeCount: 195,
    branchCount: 18,
    isSystemicallyImportant: false
  },
  {
    id: 'inst-sonas',
    name: 'SONAS',
    type: 'INSURANCE',
    license: 'INS-001',
    riskScore: 5.8,
    totalAssets: 120000000,
    capitalRatio: 12.5,
    foundedYear: 1967,
    headquarters: 'Kinshasa',
    employeeCount: 350,
    branchCount: 15,
    isSystemicallyImportant: false
  },
  {
    id: 'inst-soras',
    name: 'SORAS',
    type: 'INSURANCE',
    license: 'INS-003',
    riskScore: 6.2,
    totalAssets: 85000000,
    capitalRatio: 11.8,
    foundedYear: 1985,
    headquarters: 'Kinshasa',
    employeeCount: 220,
    branchCount: 12,
    isSystemicallyImportant: false
  }
];

// ====================
// SEUILS DE RISQUE
// ====================
export const RISK_THRESHOLDS: RiskThreshold[] = [
  {
    level: 'LOW',
    minScore: 0,
    maxScore: 3.5,
    description: 'Risque faible - Surveillance de routine',
    actions: [
      'Monitoring mensuel',
      'Reporting trimestriel',
      'Révision annuelle des limites'
    ]
  },
  {
    level: 'MEDIUM',
    minScore: 3.5,
    maxScore: 6.5,
    description: 'Risque modéré - Attention renforcée',
    actions: [
      'Monitoring bi-mensuel',
      'Reporting mensuel',
      'Révision semestrielle des politiques',
      'Stress tests trimestriels'
    ]
  },
  {
    level: 'HIGH',
    minScore: 6.5,
    maxScore: 8.5,
    description: 'Risque élevé - Surveillance intensive',
    actions: [
      'Monitoring hebdomadaire',
      'Reporting bi-mensuel',
      'Révision trimestrielle des expositions',
      'Stress tests mensuels',
      'Plan de mitigation requis'
    ]
  },
  {
    level: 'CRITICAL',
    minScore: 8.5,
    maxScore: 10,
    description: 'Risque critique - Action immédiate',
    actions: [
      'Monitoring quotidien',
      'Reporting hebdomadaire',
      'Révision immédiate des expositions',
      'Stress tests continus',
      'Plan d\'urgence activé',
      'Notification des régulateurs'
    ]
  }
];

// ====================
// CONFIGURATION MONÉTAIRE
// ====================
export const CURRENCY_CONFIG: CurrencyConfig[] = [
  {
    code: 'CDF',
    name: 'Franc congolais',
    symbol: 'FC',
    exchangeRate: 2450.50, // CDF pour 1 USD
    lastUpdate: '2025-08-03'
  },
  {
    code: 'USD',
    name: 'Dollar américain',
    symbol: '$',
    exchangeRate: 1.0,
    lastUpdate: '2025-08-03'
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    exchangeRate: 0.92,
    lastUpdate: '2025-08-03'
  }
];

// ====================
// CONSTANTES ANALYTIQUES
// ====================
export const ANALYTICS_CONSTANTS: AnalyticsConstants = {
  fraudDetectionThresholds: {
    structuringAmount: 10000000, // 10M CDF
    layeringLevels: 4,
    circularTransactionDays: 90,
    shellCompanyRevenue: 100000 // 100K CDF
  },
  systemicRiskLimits: {
    interconnectionThreshold: 0.7, // 70% d'interconnexion
    concentrationLimit: 0.25, // 25% de concentration max
    capitalAdequacyMinimum: 0.12, // 12% minimum
    liquidityRatioMinimum: 0.08 // 8% minimum
  },
  reportingFrequency: {
    dailyMetrics: [
      'fraud_alerts',
      'transaction_volume',
      'system_health'
    ],
    weeklyReports: [
      'risk_assessment',
      'portfolio_analysis',
      'market_trends'
    ],
    monthlyAnalysis: [
      'systemic_risk',
      'sector_performance',
      'geographic_analysis'
    ],
    quarterlyAssessment: [
      'comprehensive_risk_report',
      'stress_test_results',
      'regulatory_compliance'
    ]
  }
};

// ====================
// DONNÉES PAYS (RDC)
// ====================
export const DRC_COUNTRY_DATA = {
  id: 'geo-drc',
  name: 'République Démocratique du Congo',
  code: 'CD',
  iso3: 'COD',
  capital: 'Kinshasa',
  population: 95000000,
  surface: 2345409, // km²
  currency: 'CDF',
  languages: ['Français', 'Lingala', 'Kikongo', 'Tshiluba', 'Swahili'],
  timeZone: 'WAT',
  coordinates: {
    latitude: -4.0383,
    longitude: 21.7587
  },
  economicIndicators: {
    gdp: 55000000000, // USD
    gdpPerCapita: 580, // USD
    inflationRate: 8.5,
    unemploymentRate: 43.2,
    povertyRate: 77.1,
    giniIndex: 42.1
  },
  financialSystem: {
    totalBanks: 28,
    totalMicrofinance: 156,
    totalInsurance: 12,
    bankingPenetration: 26.4, // %
    mobilePenetration: 87.2, // %
    internetPenetration: 23.1 // %
  }
};
