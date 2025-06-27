import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAnalyticsConfigTable1719705216451 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'analytics_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'entity_id',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'entity_type',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'data_sharing_enabled',
            type: 'boolean',
            default: false
          },
          {
            name: 'data_sharing_scope',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ],
        indices: [
          {
            name: 'idx_entity_id_type',
            columnNames: ['entity_id', 'entity_type'],
            isUnique: true
          }
        ]
      }),
      true
    );

    // Ajouter des données initiales pour les tests
    await queryRunner.query(`
      INSERT INTO analytics_config (entity_id, entity_type, data_sharing_enabled, description)
      VALUES 
        ('SME-001', 'SME', true, 'Test SME with data sharing enabled'),
        ('SME-002', 'SME', false, 'Test SME with data sharing disabled');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('analytics_config');
  }
}
