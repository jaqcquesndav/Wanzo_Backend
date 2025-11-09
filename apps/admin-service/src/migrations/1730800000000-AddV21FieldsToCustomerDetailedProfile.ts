import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddV21FieldsToCustomerDetailedProfile1730800000000 implements MigrationInterface {
  name = 'AddV21FieldsToCustomerDetailedProfile1730800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter les nouvelles colonnes pour les fonctionnalités v2.1
    await queryRunner.addColumns('customer_detailed_profiles', [
      new TableColumn({
        name: 'specificData',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dataVersion',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'financialMetrics',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'inventoryMetrics',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'alerts',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'validationStatus',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'riskProfile',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'insights',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'criticalChanges',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'revalidationScheduled',
        type: 'jsonb',
        isNullable: true,
      }),
      new TableColumn({
        name: 'reviewPriority',
        type: 'enum',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: "'medium'",
      }),
      new TableColumn({
        name: 'requiresAttention',
        type: 'boolean',
        default: false,
      }),
    ]);

    // Mettre à jour l'enum AdminStatus pour inclure REQUIRES_ATTENTION
    await queryRunner.query(`
      ALTER TYPE "admin_status_enum" ADD VALUE 'requires_attention';
    `);

    // Créer des index pour les nouvelles colonnes qui pourraient être filtrées
    await queryRunner.query(`
      CREATE INDEX "IDX_customer_detailed_profiles_review_priority" 
      ON "customer_detailed_profiles" ("reviewPriority");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_detailed_profiles_requires_attention" 
      ON "customer_detailed_profiles" ("requiresAttention");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_detailed_profiles_data_version" 
      ON "customer_detailed_profiles" ("dataVersion");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query(`DROP INDEX "IDX_customer_detailed_profiles_data_version"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_detailed_profiles_requires_attention"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_detailed_profiles_review_priority"`);

    // Supprimer les colonnes ajoutées
    await queryRunner.dropColumns('customer_detailed_profiles', [
      'specificData',
      'dataVersion',
      'financialMetrics',
      'inventoryMetrics',
      'alerts',
      'validationStatus',
      'riskProfile',
      'insights',
      'criticalChanges',
      'revalidationScheduled',
      'reviewPriority',
      'requiresAttention',
    ]);

    // Note: La suppression d'une valeur d'enum n'est pas triviale en PostgreSQL
    // Il faudrait recréer l'enum complètement, ce qui est complexe
    // Pour cette migration descendante, nous laissons la valeur 'requires_attention'
    console.log('Note: The "requires_attention" value in admin_status_enum was not removed to avoid complexity');
  }
}