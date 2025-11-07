import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCreditScoreFieldsToFinancingRequests1703000001 implements MigrationInterface {
  name = 'AddCreditScoreFieldsToFinancingRequests1703000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter les colonnes de score crédit à la table financing_requests
    await queryRunner.addColumns('financing_requests', [
      new TableColumn({
        name: 'credit_score',
        type: 'integer',
        isNullable: true,
        comment: 'Score crédit calculé par XGBoost (1-100)'
      }),
      new TableColumn({
        name: 'credit_score_calculated_at',
        type: 'timestamp',
        isNullable: true,
        comment: 'Date de calcul du score crédit'
      }),
      new TableColumn({
        name: 'credit_score_valid_until',
        type: 'timestamp',
        isNullable: true,
        comment: 'Date d\'expiration du score crédit (validité 30 jours)'
      }),
      new TableColumn({
        name: 'credit_score_model_version',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Version du modèle XGBoost utilisé'
      }),
      new TableColumn({
        name: 'risk_level',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Niveau de risque basé sur le score crédit (LOW, MEDIUM, HIGH)'
      }),
      new TableColumn({
        name: 'confidence_score',
        type: 'decimal',
        precision: 3,
        scale: 2,
        isNullable: true,
        comment: 'Score de confiance du modèle (0-1)'
      }),
      new TableColumn({
        name: 'credit_score_data_source',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'Source des données utilisées pour le calcul'
      }),
      new TableColumn({
        name: 'credit_score_components',
        type: 'jsonb',
        isNullable: true,
        comment: 'Composants détaillés du score crédit XGBoost'
      }),
      new TableColumn({
        name: 'credit_score_explanation',
        type: 'jsonb',
        isNullable: true,
        comment: 'Facteurs explicatifs du score'
      }),
      new TableColumn({
        name: 'credit_score_recommendations',
        type: 'jsonb',
        isNullable: true,
        comment: 'Recommandations basées sur l\'analyse'
      })
    ]);

    // Créer des index pour améliorer les performances
    await queryRunner.query(`
      CREATE INDEX IDX_financing_requests_credit_score 
      ON financing_requests (credit_score) 
      WHERE credit_score IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_financing_requests_risk_level 
      ON financing_requests (risk_level) 
      WHERE risk_level IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_financing_requests_credit_score_date 
      ON financing_requests (credit_score_calculated_at) 
      WHERE credit_score_calculated_at IS NOT NULL;
    `);

    // Ajouter des contraintes de validation
    await queryRunner.query(`
      ALTER TABLE financing_requests 
      ADD CONSTRAINT CHK_credit_score_range 
      CHECK (credit_score IS NULL OR (credit_score >= 1 AND credit_score <= 100));
    `);

    await queryRunner.query(`
      ALTER TABLE financing_requests 
      ADD CONSTRAINT CHK_confidence_score_range 
      CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));
    `);

    await queryRunner.query(`
      ALTER TABLE financing_requests 
      ADD CONSTRAINT CHK_risk_level_values 
      CHECK (risk_level IS NULL OR risk_level IN ('LOW', 'MEDIUM', 'HIGH'));
    `);

    console.log('✅ Credit score fields added to financing_requests table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les contraintes
    await queryRunner.query(`
      ALTER TABLE financing_requests DROP CONSTRAINT IF EXISTS CHK_risk_level_values;
    `);
    await queryRunner.query(`
      ALTER TABLE financing_requests DROP CONSTRAINT IF EXISTS CHK_confidence_score_range;
    `);
    await queryRunner.query(`
      ALTER TABLE financing_requests DROP CONSTRAINT IF EXISTS CHK_credit_score_range;
    `);

    // Supprimer les index
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_financing_requests_credit_score_date;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_financing_requests_risk_level;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_financing_requests_credit_score;`);

    // Supprimer les colonnes
    await queryRunner.dropColumns('financing_requests', [
      'credit_score_recommendations',
      'credit_score_explanation',
      'credit_score_components',
      'credit_score_data_source',
      'confidence_score',
      'risk_level',
      'credit_score_model_version',
      'credit_score_valid_until',
      'credit_score_calculated_at',
      'credit_score'
    ]);

    console.log('✅ Credit score fields removed from financing_requests table');
  }
}