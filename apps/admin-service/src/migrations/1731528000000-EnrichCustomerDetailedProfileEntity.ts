import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration pour enrichir CustomerDetailedProfile avec tous les champs manquants
 * Résout les problèmes d'incompatibilité identifiés dans l'audit granulaire
 * 
 * Version: 2.1.0
 * Date: 2025-11-13
 * 
 * Changements:
 * - Ajoute 12 nouveaux champs critiques
 * - Met à jour dataVersion par défaut à '2.1.0'
 * - Enrichit syncMetadata avec historique et checksums
 */
export class EnrichCustomerDetailedProfileEntity1731528000000 implements MigrationInterface {
  name = 'EnrichCustomerDetailedProfileEntity1731528000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Starting enrichment of customer_detailed_profiles...');

    // =====================================================
    // 1. AJOUT DES NOUVEAUX CHAMPS CRITIQUES
    // =====================================================

    console.log('📝 Adding new critical fields...');

    // Billing & Facturation
    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'billingContactName',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Nom du contact facturation (sync depuis customer-service)',
      }),
    );

    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'billingContactEmail',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Email du contact facturation (sync depuis customer-service)',
      }),
    );

    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'stripeCustomerId',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'ID client Stripe pour intégration paiements',
      }),
    );

    // Propriétaire
    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'ownerId',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'ID du propriétaire principal',
      }),
    );

    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'ownerEmail',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Email du propriétaire principal',
      }),
    );

    // Workflow Rejet
    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'rejectedAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Date de rejet du profil',
      }),
    );

    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'rejectedBy',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Utilisateur ayant rejeté le profil',
      }),
    );

    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'rejectionReason',
        type: 'text',
        isNullable: true,
        comment: 'Raison du rejet',
      }),
    );

    // Préférences
    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'preferences',
        type: 'jsonb',
        isNullable: true,
        comment: 'Préférences utilisateur (sync depuis customer-service)',
      }),
    );

    // Description
    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'description',
        type: 'text',
        isNullable: true,
        comment: 'Description détaillée du client',
      }),
    );

    // Vérification
    await queryRunner.addColumn(
      'customer_detailed_profiles',
      new TableColumn({
        name: 'lastVerifiedAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Date de dernière vérification du profil',
      }),
    );

    // =====================================================
    // 2. MISE À JOUR DU CHAMP dataVersion
    // =====================================================

    console.log('📝 Updating dataVersion column...');

    // Modifier la colonne dataVersion pour avoir une valeur par défaut
    await queryRunner.query(`
      ALTER TABLE "customer_detailed_profiles" 
      ALTER COLUMN "dataVersion" SET DEFAULT '2.1.0'
    `);

    // Mettre à jour les enregistrements existants
    await queryRunner.query(`
      UPDATE "customer_detailed_profiles" 
      SET "dataVersion" = '2.1.0' 
      WHERE "dataVersion" IS NULL OR "dataVersion" = ''
    `);

    // =====================================================
    // 3. ENRICHISSEMENT DE syncMetadata
    // =====================================================

    console.log('📝 Enriching syncMetadata for existing records...');

    // Ajouter les nouveaux champs dans syncMetadata pour les enregistrements existants
    await queryRunner.query(`
      UPDATE "customer_detailed_profiles"
      SET "syncMetadata" = jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE("syncMetadata", '{}'::jsonb),
            '{syncHistory}',
            '[]'::jsonb,
            true
          ),
          '{dataChecksum}',
          'null'::jsonb,
          true
        ),
        '{conflictsDetected}',
        '[]'::jsonb,
        true
      )
      WHERE "syncMetadata" IS NOT NULL
    `);

    // =====================================================
    // 4. CRÉATION D'INDEX POUR LES NOUVEAUX CHAMPS
    // =====================================================

    console.log('📝 Creating indexes for new fields...');

    // Index pour recherches par ownerId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_detailed_profiles_ownerId" 
      ON "customer_detailed_profiles" ("ownerId")
    `);

    // Index pour recherches par stripeCustomerId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_detailed_profiles_stripeCustomerId" 
      ON "customer_detailed_profiles" ("stripeCustomerId")
    `);

    // Index pour filtrage des profils rejetés
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_detailed_profiles_rejectedAt" 
      ON "customer_detailed_profiles" ("rejectedAt")
      WHERE "rejectedAt" IS NOT NULL
    `);

    // Index pour dernière vérification
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_detailed_profiles_lastVerifiedAt" 
      ON "customer_detailed_profiles" ("lastVerifiedAt")
      WHERE "lastVerifiedAt" IS NOT NULL
    `);

    // =====================================================
    // 5. MIGRATION DES DONNÉES EXISTANTES
    // =====================================================

    console.log('📝 Migrating existing data...');

    // Migrer les données du champ preferences s'il existait dans profileData
    await queryRunner.query(`
      UPDATE "customer_detailed_profiles"
      SET "preferences" = ("profileData"->>'preferences')::jsonb
      WHERE "profileData" ? 'preferences' AND "preferences" IS NULL
    `);

    // Migrer description s'il existait dans profileData
    await queryRunner.query(`
      UPDATE "customer_detailed_profiles"
      SET "description" = "profileData"->>'description'
      WHERE "profileData" ? 'description' AND "description" IS NULL
    `);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Added 11 new columns');
    console.log('   - Updated dataVersion to 2.1.0');
    console.log('   - Enriched syncMetadata structure');
    console.log('   - Created 4 new indexes');
    console.log('   - Migrated existing data');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Reverting enrichment of customer_detailed_profiles...');

    // =====================================================
    // SUPPRIMER LES INDEX
    // =====================================================

    console.log('📝 Dropping indexes...');

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_detailed_profiles_ownerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_detailed_profiles_stripeCustomerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_detailed_profiles_rejectedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_detailed_profiles_lastVerifiedAt"`);

    // =====================================================
    // SUPPRIMER LES COLONNES
    // =====================================================

    console.log('📝 Dropping columns...');

    await queryRunner.dropColumn('customer_detailed_profiles', 'lastVerifiedAt');
    await queryRunner.dropColumn('customer_detailed_profiles', 'description');
    await queryRunner.dropColumn('customer_detailed_profiles', 'preferences');
    await queryRunner.dropColumn('customer_detailed_profiles', 'rejectionReason');
    await queryRunner.dropColumn('customer_detailed_profiles', 'rejectedBy');
    await queryRunner.dropColumn('customer_detailed_profiles', 'rejectedAt');
    await queryRunner.dropColumn('customer_detailed_profiles', 'ownerEmail');
    await queryRunner.dropColumn('customer_detailed_profiles', 'ownerId');
    await queryRunner.dropColumn('customer_detailed_profiles', 'stripeCustomerId');
    await queryRunner.dropColumn('customer_detailed_profiles', 'billingContactEmail');
    await queryRunner.dropColumn('customer_detailed_profiles', 'billingContactName');

    // =====================================================
    // RÉINITIALISER dataVersion
    // =====================================================

    console.log('📝 Resetting dataVersion...');

    await queryRunner.query(`
      ALTER TABLE "customer_detailed_profiles" 
      ALTER COLUMN "dataVersion" DROP DEFAULT
    `);

    console.log('✅ Rollback completed successfully!');
  }
}
