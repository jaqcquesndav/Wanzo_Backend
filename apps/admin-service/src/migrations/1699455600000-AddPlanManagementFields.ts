import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanManagementFields1699455600000 implements MigrationInterface {
    name = 'AddPlanManagementFields1699455600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter les nouveaux champs à la table subscription_plans
        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "customerType" character varying DEFAULT 'SME'
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "annualPrice" numeric(10,2)
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "annualDiscount" numeric(5,2) DEFAULT 0
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "status" character varying DEFAULT 'DRAFT'
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "previousVersionId" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "isVisible" boolean DEFAULT true
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "sortOrder" integer DEFAULT 0
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "tags" text[]
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "deployedAt" timestamp
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "archivedAt" timestamp
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "createdBy" character varying
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "updatedBy" character varying
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "deployedBy" character varying
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "archivedBy" character varying
        `);

        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD COLUMN IF NOT EXISTS "analytics" jsonb
        `);

        // Créer des index pour améliorer les performances
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_subscription_plans_customer_type_status" 
            ON "subscription_plans" ("customerType", "status")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_subscription_plans_status_active" 
            ON "subscription_plans" ("status", "isActive")
        `);

        // Ajouter une contrainte de clé étrangère pour previousVersionId
        await queryRunner.query(`
            ALTER TABLE "subscription_plans" 
            ADD CONSTRAINT "FK_subscription_plans_previous_version" 
            FOREIGN KEY ("previousVersionId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL
        `);

        // Mettre à jour les plans existants avec les valeurs par défaut
        await queryRunner.query(`
            UPDATE "subscription_plans" 
            SET 
                "customerType" = 'SME',
                "status" = 'DEPLOYED',
                "version" = 1,
                "isVisible" = true,
                "sortOrder" = 0,
                "analytics" = '{
                    "totalSubscriptions": 0,
                    "activeSubscriptions": 0,
                    "churnRate": 0,
                    "averageLifetimeValue": 0,
                    "monthlyRecurringRevenue": 0,
                    "conversionRate": 0,
                    "popularFeatures": [],
                    "customerSatisfactionScore": 0,
                    "supportTicketsPerMonth": 0
                }'::jsonb
            WHERE "customerType" IS NULL OR "status" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les contraintes et index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_plans_status_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_plans_customer_type_status"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP CONSTRAINT IF EXISTS "FK_subscription_plans_previous_version"`);

        // Supprimer les colonnes ajoutées
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "archivedBy"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "deployedBy"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "updatedBy"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "createdBy"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "archivedAt"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "deployedAt"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "analytics"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "tags"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "sortOrder"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "isVisible"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "previousVersionId"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "version"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "status"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "annualDiscount"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "annualPrice"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "customerType"`);
    }
}