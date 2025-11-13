import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration pour supprimer les tables et colonnes redondantes
 * et ajouter customerId à Customer pour référencer CustomerDetailedProfile
 */
export class RemoveRedundantTablesAndColumns1731500000000 implements MigrationInterface {
    name = 'RemoveRedundantTablesAndColumns1731500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Sauvegarder les validations existantes si nécessaire
        await queryRunner.query(`
            -- Backup des données de validation existantes
            CREATE TABLE IF NOT EXISTS customers_backup AS 
            SELECT * FROM customers;
        `);

        // 2. Supprimer les contraintes de clé étrangère
        await queryRunner.query(`
            ALTER TABLE "customer_pme_specific_data" 
            DROP CONSTRAINT IF EXISTS "FK_customer_pme_specific_data_customer";
        `);
        
        await queryRunner.query(`
            ALTER TABLE "customer_financial_institution_specific_data" 
            DROP CONSTRAINT IF EXISTS "FK_customer_financial_institution_specific_data_customer";
        `);

        // 3. Supprimer les tables obsolètes
        await queryRunner.query(`DROP TABLE IF EXISTS "customer_pme_specific_data" CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS "customer_financial_institution_specific_data" CASCADE;`);

        // 4. Créer une nouvelle table customers simplifiée
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "customers_new" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "customerId" character varying NOT NULL,
                "validatedAt" TIMESTAMP,
                "validatedBy" character varying,
                "suspendedAt" TIMESTAMP,
                "suspendedBy" character varying,
                "suspensionReason" character varying,
                "reactivatedAt" TIMESTAMP,
                "reactivatedBy" character varying,
                "validationHistory" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_customers_new" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_customers_new_customerId" UNIQUE ("customerId")
            );
        `);

        // 5. Migrer les données de validation de l'ancienne table
        await queryRunner.query(`
            INSERT INTO "customers_new" 
                ("id", "customerId", "validatedAt", "validatedBy", "suspendedAt", 
                 "suspendedBy", "suspensionReason", "reactivatedAt", "reactivatedBy", 
                 "validationHistory", "createdAt", "updatedAt")
            SELECT 
                "id",
                "id" as "customerId", -- Temporairement utiliser l'ancien ID
                "validatedAt",
                "validatedBy",
                "suspendedAt",
                "suspendedBy",
                "suspensionReason",
                "reactivatedAt",
                "reactivatedBy",
                "validationHistory",
                "createdAt",
                "updatedAt"
            FROM "customers_backup"
            WHERE "id" IS NOT NULL;
        `);

        // 6. Mettre à jour les références dans les tables liées
        await queryRunner.query(`
            -- Mettre à jour customer_documents
            ALTER TABLE "customer_documents" 
            DROP CONSTRAINT IF EXISTS "FK_customer_documents_customer";
            
            ALTER TABLE "customer_documents"
            RENAME COLUMN "customerId" TO "customerId_old";
            
            ALTER TABLE "customer_documents"
            ADD COLUMN "customerId" character varying;
            
            UPDATE "customer_documents" cd
            SET "customerId" = cn."customerId"
            FROM "customers_new" cn
            WHERE cd."customerId_old" = cn."id";
        `);

        await queryRunner.query(`
            -- Mettre à jour customer_activities
            ALTER TABLE "customer_activities" 
            DROP CONSTRAINT IF EXISTS "FK_customer_activities_customer";
            
            ALTER TABLE "customer_activities"
            RENAME COLUMN "customerId" TO "customerId_old";
            
            ALTER TABLE "customer_activities"
            ADD COLUMN "customerId" character varying;
            
            UPDATE "customer_activities" ca
            SET "customerId" = cn."customerId"
            FROM "customers_new" cn
            WHERE ca."customerId_old" = cn."id";
        `);

        await queryRunner.query(`
            -- Mettre à jour customer_validation_processes
            ALTER TABLE "customer_validation_processes" 
            DROP CONSTRAINT IF EXISTS "FK_customer_validation_processes_customer";
            
            ALTER TABLE "customer_validation_processes"
            RENAME COLUMN "customerId" TO "customerId_old";
            
            ALTER TABLE "customer_validation_processes"
            ADD COLUMN "customerId" character varying;
            
            UPDATE "customer_validation_processes" cvp
            SET "customerId" = cn."customerId"
            FROM "customers_new" cn
            WHERE cvp."customerId_old" = cn."id";
        `);

        // 7. Supprimer l'ancienne table et renommer la nouvelle
        await queryRunner.query(`DROP TABLE IF EXISTS "customers" CASCADE;`);
        await queryRunner.query(`ALTER TABLE "customers_new" RENAME TO "customers";`);

        // 8. Recréer les contraintes de clé étrangère avec customerId (string)
        await queryRunner.query(`
            ALTER TABLE "customer_documents"
            ADD CONSTRAINT "FK_customer_documents_customer" 
            FOREIGN KEY ("customerId") 
            REFERENCES "customers"("customerId") 
            ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "customer_activities"
            ADD CONSTRAINT "FK_customer_activities_customer" 
            FOREIGN KEY ("customerId") 
            REFERENCES "customers"("customerId") 
            ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "customer_validation_processes"
            ADD CONSTRAINT "FK_customer_validation_processes_customer" 
            FOREIGN KEY ("customerId") 
            REFERENCES "customers"("customerId") 
            ON DELETE CASCADE;
        `);

        // 9. Nettoyer les colonnes temporaires
        await queryRunner.query(`ALTER TABLE "customer_documents" DROP COLUMN IF EXISTS "customerId_old";`);
        await queryRunner.query(`ALTER TABLE "customer_activities" DROP COLUMN IF EXISTS "customerId_old";`);
        await queryRunner.query(`ALTER TABLE "customer_validation_processes" DROP COLUMN IF EXISTS "customerId_old";`);

        // 10. Nettoyer la table de backup
        await queryRunner.query(`DROP TABLE IF EXISTS "customers_backup";`);

        // 11. Créer les index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_customers_customerId" 
            ON "customers" ("customerId");
        `);

        console.log('✅ Migration completed: Removed redundant tables and columns');
        console.log('✅ Customer table now references CustomerDetailedProfile via customerId');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaurer l'ancienne structure (difficile car données perdues)
        console.log('⚠️  WARNING: This migration is not fully reversible');
        console.log('⚠️  Redundant tables (customer_pme_specific_data, customer_financial_institution_specific_data) data will be lost');
        
        // Recréer les tables obsolètes (vides)
        await queryRunner.query(`
            CREATE TABLE "customer_pme_specific_data" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "customerId" uuid NOT NULL,
                "industry" character varying NOT NULL,
                "size" character varying NOT NULL,
                "employeesCount" integer NOT NULL,
                "yearFounded" integer,
                "registrationNumber" character varying,
                "taxId" character varying,
                "businessLicense" character varying,
                CONSTRAINT "PK_customer_pme_specific_data" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "customer_financial_institution_specific_data" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "customerId" uuid NOT NULL,
                "institutionType" character varying NOT NULL,
                "regulatoryBody" character varying,
                "regulatoryLicenseNumber" character varying,
                "branchesCount" integer,
                "clientsCount" integer,
                "assetsUnderManagement" numeric(15,2),
                CONSTRAINT "PK_customer_financial_institution_specific_data" PRIMARY KEY ("id")
            );
        `);

        console.log('⚠️  Old structure recreated but data is lost. Manual intervention required.');
    }
}
