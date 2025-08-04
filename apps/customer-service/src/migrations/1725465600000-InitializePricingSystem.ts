import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializePricingSystem1725465600000 implements MigrationInterface {
  name = 'InitializePricingSystem1725465600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table subscription_plans mise à jour
    await queryRunner.query(`
      ALTER TABLE subscription_plans 
      ADD COLUMN IF NOT EXISTS config_id VARCHAR NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS customer_type VARCHAR NOT NULL DEFAULT 'sme',
      ADD COLUMN IF NOT EXISTS token_allocation JSONB,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tags TEXT[],
      ADD COLUMN IF NOT EXISTS metadata JSONB
    `);

    // Créer la table token_packages mise à jour
    await queryRunner.query(`
      ALTER TABLE token_packages 
      ADD COLUMN IF NOT EXISTS config_id VARCHAR NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS price_per_million_tokens DECIMAL(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bonus_percentage DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS customer_types TEXT[],
      ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS metadata JSONB
    `);

    // Créer la table feature_usage_tracking
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS feature_usage_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id),
        feature_code VARCHAR NOT NULL,
        usage_count INTEGER DEFAULT 1,
        tokens_cost BIGINT,
        usage_date DATE NOT NULL,
        usage_period VARCHAR NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer les index pour feature_usage_tracking
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_feature_usage_customer_feature_date 
      ON feature_usage_tracking(customer_id, feature_code, usage_date)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_feature_usage_customer_feature_period 
      ON feature_usage_tracking(customer_id, feature_code, usage_period)
    `);

    // Créer la table customer_feature_limits
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_feature_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id),
        plan_id VARCHAR NOT NULL,
        feature_code VARCHAR NOT NULL,
        period VARCHAR NOT NULL,
        limit_value INTEGER,
        current_usage INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP,
        UNIQUE(customer_id, feature_code, period)
      )
    `);

    // Créer la table customer_token_balances
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_token_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id),
        total_tokens BIGINT DEFAULT 0,
        used_tokens BIGINT DEFAULT 0,
        remaining_tokens BIGINT DEFAULT 0,
        monthly_allocation BIGINT DEFAULT 0,
        rolled_over_tokens BIGINT DEFAULT 0,
        purchased_tokens BIGINT DEFAULT 0,
        bonus_tokens BIGINT DEFAULT 0,
        current_period VARCHAR NOT NULL,
        period_start_date TIMESTAMP NOT NULL,
        period_end_date TIMESTAMP NOT NULL,
        rollover_history JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer l'index pour customer_token_balances
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_token_balances_customer 
      ON customer_token_balances(customer_id)
    `);

    // Créer la table token_transactions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS token_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id),
        transaction_type VARCHAR NOT NULL,
        token_amount BIGINT NOT NULL,
        balance_before BIGINT NOT NULL,
        balance_after BIGINT NOT NULL,
        feature_code VARCHAR,
        related_entity_id VARCHAR,
        related_entity_type VARCHAR,
        cost_usd DECIMAL(10,2),
        description TEXT,
        metadata JSONB,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer les index pour token_transactions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_token_transactions_customer_date 
      ON token_transactions(customer_id, transaction_date)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_token_transactions_customer_type 
      ON token_transactions(customer_id, transaction_type)
    `);

    // Créer des index supplémentaires pour les performances
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subscription_plans_customer_type_active 
      ON subscription_plans(customer_type, is_active) WHERE is_active = true
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_token_packages_customer_types_active 
      ON token_packages USING GIN(customer_types) WHERE is_active = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse
    await queryRunner.query(`DROP TABLE IF EXISTS token_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_token_balances`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_feature_limits`);
    await queryRunner.query(`DROP TABLE IF EXISTS feature_usage_tracking`);

    // Supprimer les colonnes ajoutées (optionnel, à commenter si on veut garder la compatibilité)
    /*
    await queryRunner.query(`
      ALTER TABLE subscription_plans 
      DROP COLUMN IF EXISTS config_id,
      DROP COLUMN IF EXISTS customer_type,
      DROP COLUMN IF EXISTS token_allocation,
      DROP COLUMN IF EXISTS is_active,
      DROP COLUMN IF EXISTS is_visible,
      DROP COLUMN IF EXISTS sort_order,
      DROP COLUMN IF EXISTS tags,
      DROP COLUMN IF EXISTS metadata
    `);

    await queryRunner.query(`
      ALTER TABLE token_packages 
      DROP COLUMN IF EXISTS config_id,
      DROP COLUMN IF EXISTS price_per_million_tokens,
      DROP COLUMN IF EXISTS bonus_percentage,
      DROP COLUMN IF EXISTS customer_types,
      DROP COLUMN IF EXISTS is_visible,
      DROP COLUMN IF EXISTS is_active,
      DROP COLUMN IF EXISTS sort_order,
      DROP COLUMN IF EXISTS metadata
    `);
    */
  }
}
