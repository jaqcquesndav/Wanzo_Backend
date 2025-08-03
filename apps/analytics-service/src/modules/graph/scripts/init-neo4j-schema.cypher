// Script d'initialisation Neo4j pour le système financier Wanzo RDC
// Ce script crée le schéma complet, les contraintes, index et données de référence

// ===============================================
// 1. CONTRAINTES ET INDEX (exécuter en premier)
// ===============================================

// Contraintes d'unicité pour les entités principales
CREATE CONSTRAINT sme_id_unique IF NOT EXISTS FOR (n:SME) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT institution_id_unique IF NOT EXISTS FOR (n:Institution) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT portfolio_id_unique IF NOT EXISTS FOR (n:Portfolio) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT credit_id_unique IF NOT EXISTS FOR (n:Credit) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT customer_id_unique IF NOT EXISTS FOR (n:Customer) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT guarantee_id_unique IF NOT EXISTS FOR (n:Guarantee) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT risk_event_id_unique IF NOT EXISTS FOR (n:RiskEvent) REQUIRE n.id IS UNIQUE;

// Contraintes géographiques
CREATE CONSTRAINT province_code_unique IF NOT EXISTS FOR (n:Province) REQUIRE n.code IS UNIQUE;
CREATE CONSTRAINT city_name_unique IF NOT EXISTS FOR (n:City) REQUIRE (n.name, n.provinceCode) IS UNIQUE;
CREATE CONSTRAINT sector_code_unique IF NOT EXISTS FOR (n:Sector) REQUIRE n.code IS UNIQUE;

// Index pour les recherches fréquentes
CREATE INDEX sme_risk_score_idx IF NOT EXISTS FOR (n:SME) ON (n.riskScore);
CREATE INDEX sme_revenue_idx IF NOT EXISTS FOR (n:SME) ON (n.revenue);
CREATE INDEX sme_status_idx IF NOT EXISTS FOR (n:SME) ON (n.status);
CREATE INDEX institution_type_idx IF NOT EXISTS FOR (n:Institution) ON (n.type);
CREATE INDEX credit_status_idx IF NOT EXISTS FOR (n:Credit) ON (n.status);
CREATE INDEX credit_amount_idx IF NOT EXISTS FOR (n:Credit) ON (n.amount);
CREATE INDEX risk_event_timestamp_idx IF NOT EXISTS FOR (n:RiskEvent) ON (n.timestamp);
CREATE INDEX risk_event_severity_idx IF NOT EXISTS FOR (n:RiskEvent) ON (n.severity);

// ===============================================
// 2. DONNÉES GÉOGRAPHIQUES - RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
// ===============================================

// Nœud pays
CREATE (:Country {
  id: 'RDC',
  name: 'République Démocratique du Congo',
  code: 'CD',
  capital: 'Kinshasa',
  population: 95000000,
  currency: 'CDF',
  riskScore: 6.2,
  economicIndicators: {
    gdpTotal: 50000000000,
    gdpPerCapita: 526,
    inflationRate: 0.08,
    businessClimate: 'CHALLENGING'
  },
  lastUpdate: datetime()
});

// Provinces principales de la RDC
CREATE 
  (:Province {id: 'KIN', name: 'Kinshasa', code: 'KIN', capital: 'Kinshasa', population: 14970000, riskScore: 4.1, economicWeight: 0.25}),
  (:Province {id: 'KAT', name: 'Katanga', code: 'KAT', capital: 'Lubumbashi', population: 5990000, riskScore: 6.1, economicWeight: 0.20}),
  (:Province {id: 'KAS', name: 'Kasaï', code: 'KAS', capital: 'Kananga', population: 3200000, riskScore: 5.9, economicWeight: 0.15}),
  (:Province {id: 'NK', name: 'Nord-Kivu', code: 'NK', capital: 'Goma', population: 6655000, riskScore: 7.2, economicWeight: 0.08}),
  (:Province {id: 'SK', name: 'Sud-Kivu', code: 'SK', capital: 'Bukavu', population: 5772000, riskScore: 6.8, economicWeight: 0.07}),
  (:Province {id: 'BC', name: 'Kongo Central', code: 'BC', capital: 'Matadi', population: 4500000, riskScore: 5.4, economicWeight: 0.12}),
  (:Province {id: 'EQ', name: 'Équateur', code: 'EQ', capital: 'Mbandaka', population: 1626000, riskScore: 6.4, economicWeight: 0.06}),
  (:Province {id: 'TSH', name: 'Tshopo', code: 'TSH', capital: 'Kisangani', population: 2614000, riskScore: 6.6, economicWeight: 0.05});

// Principales villes
CREATE 
  (:City {id: 'GOMBE', name: 'Gombe', provinceCode: 'KIN', isCapital: false, population: 350000, riskScore: 2.1, businessDistrict: true}),
  (:City {id: 'LIMETE', name: 'Limete', provinceCode: 'KIN', isCapital: false, population: 400000, riskScore: 3.8, industrial: true}),
  (:City {id: 'LUBUM', name: 'Lubumbashi', provinceCode: 'KAT', isCapital: true, population: 1786000, riskScore: 5.8, mining: true}),
  (:City {id: 'MATADI', name: 'Matadi', provinceCode: 'BC', isCapital: true, population: 245000, riskScore: 5.3, port: true}),
  (:City {id: 'GOMA', name: 'Goma', provinceCode: 'NK', isCapital: true, population: 670000, riskScore: 7.5, conflictZone: true}),
  (:City {id: 'BUKAVU', name: 'Bukavu', provinceCode: 'SK', isCapital: true, population: 806000, riskScore: 6.9, borderCity: true});

// Relations géographiques
MATCH (country:Country {id: 'RDC'})
MATCH (province:Province)
CREATE (province)-[:PART_OF]->(country);

MATCH (province:Province), (city:City)
WHERE city.provinceCode = province.code
CREATE (city)-[:PART_OF]->(province);

// ===============================================
// 3. SECTEURS ÉCONOMIQUES RDC
// ===============================================

CREATE 
  (:Sector {id: 'AGR', name: 'Agriculture', code: 'AGR', riskLevel: 'MEDIUM', defaultRate: 0.12, growthRate: 0.08, totalSMEs: 2450, description: 'Agriculture et élevage'}),
  (:Sector {id: 'MIN', name: 'Mines et Carrières', code: 'MIN', riskLevel: 'HIGH', defaultRate: 0.18, growthRate: 0.15, totalSMEs: 890, description: 'Extraction minière et carrières'}),
  (:Sector {id: 'COM', name: 'Commerce', code: 'COM', riskLevel: 'LOW', defaultRate: 0.07, growthRate: 0.05, totalSMEs: 5670, description: 'Commerce de gros et détail'}),
  (:Sector {id: 'SER', name: 'Services', code: 'SER', riskLevel: 'LOW', defaultRate: 0.06, growthRate: 0.12, totalSMEs: 3210, description: 'Services aux entreprises et particuliers'}),
  (:Sector {id: 'IND', name: 'Industrie', code: 'IND', riskLevel: 'MEDIUM', defaultRate: 0.14, growthRate: 0.03, totalSMEs: 1340, description: 'Industrie manufacturière'}),
  (:Sector {id: 'CON', name: 'Construction', code: 'CON', riskLevel: 'HIGH', defaultRate: 0.22, growthRate: 0.25, totalSMEs: 780, description: 'BTP et construction'}),
  (:Sector {id: 'TRA', name: 'Transport', code: 'TRA', riskLevel: 'MEDIUM', defaultRate: 0.11, growthRate: 0.07, totalSMEs: 1560, description: 'Transport et logistique'}),
  (:Sector {id: 'TEC', name: 'Technologie', code: 'TEC', riskLevel: 'LOW', defaultRate: 0.04, growthRate: 0.35, totalSMEs: 320, description: 'IT et télécommunications'});

// ===============================================
// 4. INSTITUTIONS FINANCIÈRES
// ===============================================

// Banque Centrale
CREATE (:Institution {
  id: 'BCC',
  name: 'Banque Centrale du Congo',
  type: 'CENTRAL_BANK',
  license: 'BCC-001',
  riskScore: 1.0,
  totalAssets: 5000000000,
  capitalRatio: 0.98,
  foundedYear: 1960,
  regulator: true,
  headquarters: 'Kinshasa'
});

// Banques commerciales principales
CREATE 
  (:Institution {id: 'RAWBANK', name: 'Rawbank', type: 'COMMERCIAL_BANK', license: 'BCC-CB-001', riskScore: 2.5, totalAssets: 2800000000, capitalRatio: 0.15, marketShare: 0.25}),
  (:Institution {id: 'BCDC', name: 'BCDC', type: 'COMMERCIAL_BANK', license: 'BCC-CB-002', riskScore: 3.1, totalAssets: 1900000000, capitalRatio: 0.14, marketShare: 0.18}),
  (:Institution {id: 'TMB', name: 'Trust Merchant Bank', type: 'COMMERCIAL_BANK', license: 'BCC-CB-003', riskScore: 2.8, totalAssets: 1200000000, capitalRatio: 0.16, marketShare: 0.12}),
  (:Institution {id: 'ECOBANK', name: 'Ecobank RDC', type: 'COMMERCIAL_BANK', license: 'BCC-CB-004', riskScore: 2.2, totalAssets: 980000000, capitalRatio: 0.18, marketShare: 0.10});

// Institutions de microfinance
CREATE 
  (:Institution {id: 'FINCA', name: 'FINCA RDC', type: 'MICROFINANCE', license: 'BCC-MFI-001', riskScore: 4.2, totalAssets: 45000000, clientsCount: 125000}),
  (:Institution {id: 'MECREFI', name: 'MECREFI', type: 'MICROFINANCE', license: 'BCC-MFI-002', riskScore: 4.8, totalAssets: 32000000, clientsCount: 89000});

// Relations de supervision
MATCH (bcc:Institution {id: 'BCC'}), (bank:Institution)
WHERE bank.type IN ['COMMERCIAL_BANK', 'MICROFINANCE'] AND bank.id <> 'BCC'
CREATE (bcc)-[:SUPERVISES]->(bank);

// ===============================================
// 5. PORTFOLIOS TYPES
// ===============================================

CREATE 
  (:Portfolio {id: 'PORT-SME-AGR', name: 'Portfolio PME Agriculture', targetAmount: 50000000, currentAmount: 32000000, riskProfile: 'MODERATE', sectorFocus: 'AGR', expectedReturn: 0.15}),
  (:Portfolio {id: 'PORT-SME-MIN', name: 'Portfolio PME Mines', targetAmount: 80000000, currentAmount: 65000000, riskProfile: 'AGGRESSIVE', sectorFocus: 'MIN', expectedReturn: 0.22}),
  (:Portfolio {id: 'PORT-COMMERCE', name: 'Portfolio Commerce', targetAmount: 120000000, currentAmount: 98000000, riskProfile: 'CONSERVATIVE', sectorFocus: 'COM', expectedReturn: 0.12}),
  (:Portfolio {id: 'PORT-MICRO', name: 'Portfolio Microfinance', targetAmount: 25000000, currentAmount: 18000000, riskProfile: 'MODERATE', sectorFocus: 'SER', expectedReturn: 0.18});

// Relations portfolio -> institution
MATCH (rawbank:Institution {id: 'RAWBANK'}), (port1:Portfolio {id: 'PORT-SME-AGR'})
CREATE (rawbank)-[:MANAGES]->(port1);

MATCH (bcdc:Institution {id: 'BCDC'}), (port2:Portfolio {id: 'PORT-SME-MIN'})
CREATE (bcdc)-[:MANAGES]->(port2);

MATCH (finca:Institution {id: 'FINCA'}), (port3:Portfolio {id: 'PORT-MICRO'})
CREATE (finca)-[:MANAGES]->(port3);

// ===============================================
// 6. EXEMPLES DE PME PAR SECTEUR ET RÉGION
// ===============================================

// PME Agriculture - Kinshasa
CREATE (:SME {
  id: 'SME-AGR-001',
  name: 'Agro-Business Kinshasa SARL',
  registrationNumber: 'CD-KIN-2018-001234',
  foundedYear: 2018,
  employees: 15,
  revenue: 850000,
  riskScore: 5.2,
  status: 'ACTIVE',
  legalForm: 'SARL',
  taxId: 'A0875643T'
});

// PME Mines - Katanga
CREATE (:SME {
  id: 'SME-MIN-001',
  name: 'Congo Minerals Extract',
  registrationNumber: 'CD-KAT-2016-005678',
  foundedYear: 2016,
  employees: 45,
  revenue: 2800000,
  riskScore: 7.1,
  status: 'ACTIVE',
  legalForm: 'SA',
  taxId: 'M1234567T'
});

// PME Commerce - Kinshasa Gombe
CREATE (:SME {
  id: 'SME-COM-001',
  name: 'Import-Export Gombe',
  registrationNumber: 'CD-KIN-2019-002345',
  foundedYear: 2019,
  employees: 8,
  revenue: 650000,
  riskScore: 3.8,
  status: 'ACTIVE',
  legalForm: 'SARL',
  taxId: 'C0987654T'
});

// Relations SME -> Secteur et Géographie
MATCH (sme1:SME {id: 'SME-AGR-001'}), (agr:Sector {code: 'AGR'}), (kin:City {id: 'GOMBE'})
CREATE (sme1)-[:OPERATES_IN]->(agr), (sme1)-[:LOCATED_IN]->(kin);

MATCH (sme2:SME {id: 'SME-MIN-001'}), (min:Sector {code: 'MIN'}), (lub:City {id: 'LUBUM'})
CREATE (sme2)-[:OPERATES_IN]->(min), (sme2)-[:LOCATED_IN]->(lub);

MATCH (sme3:SME {id: 'SME-COM-001'}), (com:Sector {code: 'COM'}), (gombe:City {id: 'GOMBE'})
CREATE (sme3)-[:OPERATES_IN]->(com), (sme3)-[:LOCATED_IN]->(gombe);

// ===============================================
// 7. CRÉDITS EXEMPLES
// ===============================================

CREATE 
  (:Credit {id: 'CRED-001', amount: 2500000, interestRate: 0.15, term: 24, status: 'ACTIVE', disbursementDate: '2024-06-15', riskGrade: 'B+'}),
  (:Credit {id: 'CRED-002', amount: 8000000, interestRate: 0.18, term: 36, status: 'ACTIVE', disbursementDate: '2024-03-20', riskGrade: 'C'}),
  (:Credit {id: 'CRED-003', amount: 1200000, interestRate: 0.12, term: 18, status: 'COMPLETED', disbursementDate: '2023-08-10', riskGrade: 'A'});

// Relations de crédit
MATCH (sme1:SME {id: 'SME-AGR-001'}), (cred1:Credit {id: 'CRED-001'})
CREATE (sme1)-[:HAS_CREDIT]->(cred1);

MATCH (sme2:SME {id: 'SME-MIN-001'}), (cred2:Credit {id: 'CRED-002'})
CREATE (sme2)-[:HAS_CREDIT]->(cred2);

MATCH (port1:Portfolio {id: 'PORT-SME-AGR'}), (cred1:Credit {id: 'CRED-001'})
CREATE (cred1)-[:PART_OF_PORTFOLIO]->(port1);

MATCH (port2:Portfolio {id: 'PORT-SME-MIN'}), (cred2:Credit {id: 'CRED-002'})
CREATE (cred2)-[:PART_OF_PORTFOLIO]->(port2);

// ===============================================
// 8. GARANTIES
// ===============================================

CREATE 
  (:Guarantee {id: 'GAR-001', type: 'REAL_ESTATE', value: 4000000, assessmentDate: '2024-06-01', condition: 'GOOD', liquidityRate: 0.8}),
  (:Guarantee {id: 'GAR-002', type: 'EQUIPMENT', value: 12000000, assessmentDate: '2024-03-15', condition: 'EXCELLENT', liquidityRate: 0.6});

// Relations garanties -> crédits
MATCH (cred1:Credit {id: 'CRED-001'}), (gar1:Guarantee {id: 'GAR-001'})
CREATE (gar1)-[:SECURES]->(cred1);

MATCH (cred2:Credit {id: 'CRED-002'}), (gar2:Guarantee {id: 'GAR-002'})
CREATE (gar2)-[:SECURES]->(cred2);

// ===============================================
// 9. ÉVÉNEMENTS DE RISQUE
// ===============================================

CREATE 
  (:RiskEvent {id: 'RISK-001', type: 'DEFAULT', severity: 'HIGH', timestamp: '2024-07-15T10:30:00Z', amount: 500000, description: 'Défaut de paiement PME Agriculture', resolved: false}),
  (:RiskEvent {id: 'RISK-002', type: 'FRAUD', severity: 'CRITICAL', timestamp: '2024-07-20T14:45:00Z', amount: 250000, description: 'Transaction suspecte détectée', resolved: true}),
  (:RiskEvent {id: 'RISK-003', type: 'MARKET', severity: 'MEDIUM', timestamp: '2024-07-25T09:15:00Z', description: 'Volatilité des prix du cuivre', resolved: false});

// Relations événements -> entités
MATCH (risk1:RiskEvent {id: 'RISK-001'}), (sme1:SME {id: 'SME-AGR-001'})
CREATE (risk1)-[:AFFECTS]->(sme1);

MATCH (risk3:RiskEvent {id: 'RISK-003'}), (sector:Sector {code: 'MIN'})
CREATE (risk3)-[:AFFECTS]->(sector);

// ===============================================
// 10. MÉTRIQUES DE PERFORMANCE
// ===============================================

// Ajout de propriétés calculées pour optimiser les requêtes
MATCH (province:Province)
SET province.lastCalculated = datetime(),
    province.smeCount = 0,
    province.avgSectorRisk = 0.0;

MATCH (sector:Sector)
SET sector.lastCalculated = datetime(),
    sector.activeCredits = 0,
    sector.totalExposure = 0;

// ===============================================
// 11. INDEX DE PERFORMANCE POUR REQUÊTES COMPLEXES
// ===============================================

// Index composites pour analyses fréquentes
CREATE INDEX risk_geo_composite_idx IF NOT EXISTS FOR (n:SME) ON (n.riskScore, n.revenue);
CREATE INDEX credit_status_amount_idx IF NOT EXISTS FOR (n:Credit) ON (n.status, n.amount);
CREATE INDEX geo_risk_composite_idx IF NOT EXISTS FOR (n:Province) ON (n.riskScore, n.economicWeight);

// Index pour requêtes de chemin
CREATE INDEX path_analysis_idx IF NOT EXISTS FOR ()-[r:HAS_CREDIT]-() ON (r.timestamp);
CREATE INDEX correlation_idx IF NOT EXISTS FOR ()-[r:CORRELATED_WITH]-() ON (r.strength);

// ===============================================
// SCRIPT TERMINÉ
// ===============================================

// Statistiques finales
MATCH (n) RETURN labels(n) as NodeType, count(n) as Count;
MATCH ()-[r]->() RETURN type(r) as RelationType, count(r) as Count;

// Message de confirmation
RETURN "Schema Neo4j initialisé avec succès pour Wanzo Financial Risk Analysis System" as Status,
       datetime() as CompletedAt;
