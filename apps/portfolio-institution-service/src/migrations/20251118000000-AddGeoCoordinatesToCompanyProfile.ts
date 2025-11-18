import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration pour ajouter les coordonnées géographiques à CompanyProfile
 * 
 * Ajoute:
 * - latitude (decimal 10,6)
 * - longitude (decimal 10,6)
 * 
 * Ces champs permettent:
 * - Recherche de prospects par proximité géographique
 * - Affichage sur carte
 * - Analyse géospatiale
 * 
 * Les coordonnées sont extraites de la location primaire lors de la synchronisation
 * depuis customer-service (événements Kafka)
 */
export class AddGeoCoordinatesToCompanyProfile20251118000000 implements MigrationInterface {
  name = 'AddGeoCoordinatesToCompanyProfile20251118000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter colonne latitude
    await queryRunner.addColumn(
      'company_profiles',
      new TableColumn({
        name: 'latitude',
        type: 'decimal',
        precision: 10,
        scale: 6,
        isNullable: true,
        comment: 'Latitude du siège principal (depuis location primaire customer-service)'
      })
    );

    // Ajouter colonne longitude
    await queryRunner.addColumn(
      'company_profiles',
      new TableColumn({
        name: 'longitude',
        type: 'decimal',
        precision: 10,
        scale: 6,
        isNullable: true,
        comment: 'Longitude du siège principal (depuis location primaire customer-service)'
      })
    );

    // Créer index pour recherche géographique efficace
    await queryRunner.query(`
      CREATE INDEX "IDX_company_profiles_geo_coordinates" 
      ON "company_profiles" ("latitude", "longitude")
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    console.log('✅ Migration AddGeoCoordinatesToCompanyProfile20251118000000 completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer l'index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_company_profiles_geo_coordinates"`);

    // Supprimer les colonnes
    await queryRunner.dropColumn('company_profiles', 'longitude');
    await queryRunner.dropColumn('company_profiles', 'latitude');

    console.log('✅ Rollback AddGeoCoordinatesToCompanyProfile20251118000000 completed successfully');
  }
}
