import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration pour créer la table company_profiles
 * Cache local des profils companies avec données hybrides accounting + customer
 * 
 * Date: 2025-11-16
 * Auteur: Portfolio Institution Service
 */
export class CreateCompanyProfilesTable20251116190347 implements MigrationInterface {
  name = 'CreateCompanyProfilesTable20251116190347';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table company_profiles
    await queryRunner.createTable(
      new Table({
        name: 'company_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            comment: 'UUID de la company (client_id utilisé dans Contract, Disbursement, Repayment, etc.)',
          },
          // ============================================================
          // DONNÉES PRIMAIRES - SOURCE: accounting-service (HTTP)
          // ============================================================
          {
            name: 'companyName',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'Nom de la company (source de vérité: accounting-service)',
          },
          {
            name: 'sector',
            type: 'varchar',
            length: '200',
            isNullable: false,
            comment: 'Secteur d\'activité',
          },
          {
            name: 'totalRevenue',
            type: 'decimal',
            precision: 20,
            scale: 2,
            default: 0,
            comment: 'Chiffre d\'affaires total (CDF)',
          },
          {
            name: 'annualRevenue',
            type: 'decimal',
            precision: 20,
            scale: 2,
            default: 0,
            comment: 'Chiffre d\'affaires annuel (CDF)',
          },
          {
            name: 'netProfit',
            type: 'decimal',
            precision: 20,
            scale: 2,
            default: 0,
            comment: 'Profit net (CDF)',
          },
          {
            name: 'totalAssets',
            type: 'decimal',
            precision: 20,
            scale: 2,
            default: 0,
            comment: 'Total des actifs (CDF)',
          },
          {
            name: 'totalLiabilities',
            type: 'decimal',
            precision: 20,
            scale: 2,
            default: 0,
            comment: 'Total des passifs (CDF)',
          },
          {
            name: 'cashFlow',
            type: 'decimal',
            precision: 20,
            scale: 2,
            default: 0,
            comment: 'Flux de trésorerie (CDF)',
          },
          {
            name: 'debtRatio',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0,
            comment: 'Ratio d\'endettement (0.0 - 1.0)',
          },
          {
            name: 'workingCapital',
            type: 'decimal',
            precision: 20,
            scale: 2,
            default: 0,
            comment: 'Fonds de roulement (CDF)',
          },
          {
            name: 'creditScore',
            type: 'int',
            default: 0,
            comment: 'Score de crédit (1-100)',
          },
          {
            name: 'financialRating',
            type: 'varchar',
            length: '10',
            default: "'N/A'",
            comment: 'Rating financier (AAA, AA, A, BBB, BB, B, C, D, E)',
          },
          {
            name: 'revenueGrowth',
            type: 'decimal',
            precision: 6,
            scale: 2,
            default: 0,
            comment: 'Croissance du chiffre d\'affaires YoY (%)',
          },
          {
            name: 'profitMargin',
            type: 'decimal',
            precision: 6,
            scale: 2,
            default: 0,
            comment: 'Marge bénéficiaire (%)',
          },
          {
            name: 'ebitda',
            type: 'decimal',
            precision: 20,
            scale: 2,
            isNullable: true,
            comment: 'EBITDA (CDF)',
          },
          {
            name: 'employeeCount',
            type: 'int',
            default: 0,
            comment: 'Nombre d\'employés (source primaire: accounting-service)',
          },
          {
            name: 'companySize',
            type: 'varchar',
            length: '50',
            default: "'small'",
            comment: 'Taille de l\'entreprise (small, medium, large)',
          },
          {
            name: 'websiteUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Site web de l\'entreprise',
          },
          // ============================================================
          // DONNÉES SECONDAIRES - SOURCE: customer-service (Kafka)
          // ============================================================
          {
            name: 'legalForm',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Forme juridique (SARL, SA, SAS, etc.)',
          },
          {
            name: 'industry',
            type: 'varchar',
            length: '200',
            isNullable: true,
            comment: 'Industrie/secteur détaillé (depuis customer-service)',
          },
          {
            name: 'rccm',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Numéro RCCM (Registre de Commerce)',
          },
          {
            name: 'taxId',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Numéro d\'identification fiscale',
          },
          {
            name: 'natId',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Numéro d\'identification nationale',
          },
          {
            name: 'yearFounded',
            type: 'int',
            isNullable: true,
            comment: 'Année de création',
          },
          {
            name: 'capital',
            type: 'jsonb',
            isNullable: true,
            comment: 'Structure du capital { amount: number, currency: string }',
          },
          {
            name: 'owner',
            type: 'jsonb',
            isNullable: true,
            comment: 'Informations du propriétaire principal',
          },
          {
            name: 'associates',
            type: 'jsonb',
            isNullable: true,
            comment: 'Liste des associés',
          },
          {
            name: 'locations',
            type: 'jsonb',
            isNullable: true,
            comment: 'Emplacements/succursales',
          },
          {
            name: 'contactPersons',
            type: 'jsonb',
            isNullable: true,
            comment: 'Personnes de contact',
          },
          {
            name: 'affiliations',
            type: 'jsonb',
            isNullable: true,
            comment: 'Affiliations (CNSS, INPP, etc.)',
          },
          {
            name: 'socialMedia',
            type: 'jsonb',
            isNullable: true,
            comment: 'Médias sociaux',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Email de la company',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Téléphone de la company',
          },
          {
            name: 'logo',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Logo URL',
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
            comment: 'Adresse complète',
          },
          {
            name: 'customerServiceStatus',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Statut dans customer-service (active, suspended, etc.)',
          },
          // ============================================================
          // MÉTADONNÉES DE SYNCHRONISATION
          // ============================================================
          {
            name: 'lastSyncFromAccounting',
            type: 'timestamp',
            isNullable: true,
            comment: 'Date de dernière synchronisation depuis accounting-service',
          },
          {
            name: 'lastSyncFromCustomer',
            type: 'timestamp',
            isNullable: true,
            comment: 'Date de dernière synchronisation depuis customer-service',
          },
          {
            name: 'profileCompleteness',
            type: 'int',
            default: 0,
            comment: 'Pourcentage de complétude du profil (0-100)',
          },
          {
            name: 'isAccountingDataFresh',
            type: 'boolean',
            default: true,
            comment: 'Indicateur si les données accounting sont à jour',
          },
          {
            name: 'isCustomerDataFresh',
            type: 'boolean',
            default: true,
            comment: 'Indicateur si les données customer sont à jour',
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '100',
            default: "'system'",
            comment: 'Source de création de l\'entrée',
          },
          {
            name: 'lastModifiedBy',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Source de dernière modification',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Métadonnées additionnelles flexibles (syncHistory, conflicts)',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Créer les indexes pour optimiser les performances
    await queryRunner.createIndex(
      'company_profiles',
      new TableIndex({
        name: 'IDX_company_profiles_companyName',
        columnNames: ['companyName'],
      }),
    );

    await queryRunner.createIndex(
      'company_profiles',
      new TableIndex({
        name: 'IDX_company_profiles_sector',
        columnNames: ['sector'],
      }),
    );

    await queryRunner.createIndex(
      'company_profiles',
      new TableIndex({
        name: 'IDX_company_profiles_creditScore',
        columnNames: ['creditScore'],
      }),
    );

    await queryRunner.createIndex(
      'company_profiles',
      new TableIndex({
        name: 'IDX_company_profiles_rccm',
        columnNames: ['rccm'],
      }),
    );

    await queryRunner.createIndex(
      'company_profiles',
      new TableIndex({
        name: 'IDX_company_profiles_taxId',
        columnNames: ['taxId'],
      }),
    );

    await queryRunner.createIndex(
      'company_profiles',
      new TableIndex({
        name: 'IDX_company_profiles_lastSyncFromAccounting',
        columnNames: ['lastSyncFromAccounting'],
      }),
    );

    // Index composite pour recherches fréquentes
    await queryRunner.createIndex(
      'company_profiles',
      new TableIndex({
        name: 'IDX_company_profiles_sector_creditScore',
        columnNames: ['sector', 'creditScore'],
      }),
    );

    await queryRunner.createIndex(
      'company_profiles',
      new TableIndex({
        name: 'IDX_company_profiles_companySize_financialRating',
        columnNames: ['companySize', 'financialRating'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les indexes
    await queryRunner.dropIndex('company_profiles', 'IDX_company_profiles_companySize_financialRating');
    await queryRunner.dropIndex('company_profiles', 'IDX_company_profiles_sector_creditScore');
    await queryRunner.dropIndex('company_profiles', 'IDX_company_profiles_lastSyncFromAccounting');
    await queryRunner.dropIndex('company_profiles', 'IDX_company_profiles_taxId');
    await queryRunner.dropIndex('company_profiles', 'IDX_company_profiles_rccm');
    await queryRunner.dropIndex('company_profiles', 'IDX_company_profiles_creditScore');
    await queryRunner.dropIndex('company_profiles', 'IDX_company_profiles_sector');
    await queryRunner.dropIndex('company_profiles', 'IDX_company_profiles_companyName');

    // Supprimer la table
    await queryRunner.dropTable('company_profiles', true);
  }
}
