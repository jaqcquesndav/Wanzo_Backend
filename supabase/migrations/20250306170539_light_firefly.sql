/*
  # Création des tables pour la gestion des abonnements et tokens

  1. Tables créées
    - subscriptions
      - id (uuid, primary key)
      - company_id (uuid, foreign key)
      - plan (text)
      - monthly_price_usd (numeric)
      - monthly_price_cdf (numeric)
      - yearly_price_usd (numeric)
      - yearly_price_cdf (numeric)
      - status (text)
      - applications (jsonb)
      - tokens (jsonb)
      - valid_until (timestamptz)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - token_transactions
      - id (uuid, primary key)
      - subscription_id (uuid, foreign key)
      - company_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - amount (integer)
      - type (text)
      - description (text)
      - metadata (jsonb)
      - created_at (timestamptz)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès basées sur l'authentification et l'appartenance à l'entreprise

  3. Indexes
    - Index sur company_id, subscription_id pour les recherches rapides
    - Index sur created_at pour le tri chronologique
*/

-- Create subscriptions table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan text NOT NULL,
  monthly_price_usd numeric NOT NULL,
  monthly_price_cdf numeric NOT NULL,
  yearly_price_usd numeric NOT NULL,
  yearly_price_cdf numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  applications jsonb NOT NULL DEFAULT '[]',
  tokens jsonb NOT NULL DEFAULT '{"remaining": 0, "used": 0}',
  valid_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
  CONSTRAINT valid_plan CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
  CONSTRAINT positive_prices CHECK (
    monthly_price_usd >= 0 AND
    monthly_price_cdf >= 0 AND
    yearly_price_usd >= 0 AND
    yearly_price_cdf >= 0
  )
);

-- Create token_transactions table
CREATE TABLE token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_type CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  CONSTRAINT valid_amount CHECK (amount != 0)
);

-- Create indexes
CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_valid_until ON subscriptions(valid_until);
CREATE INDEX idx_token_transactions_subscription_id ON token_transactions(subscription_id);
CREATE INDEX idx_token_transactions_company_id ON token_transactions(company_id);
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their company subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE company_id = subscriptions.company_id
  ));

CREATE POLICY "Only admins can modify subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = subscriptions.company_id
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create policies for token_transactions
CREATE POLICY "Users can view their company token transactions"
  ON token_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE company_id = token_transactions.company_id
  ));

CREATE POLICY "Users can create token usage transactions"
  ON token_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type = 'usage'
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND company_id = token_transactions.company_id
    )
  );

-- Create function to update subscription tokens
CREATE OR REPLACE FUNCTION update_subscription_tokens()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'usage' THEN
    UPDATE subscriptions
    SET tokens = jsonb_set(
      tokens,
      '{remaining}',
      to_jsonb(GREATEST(0, (tokens->>'remaining')::int - NEW.amount))
    )
    WHERE id = NEW.subscription_id;
    
    UPDATE subscriptions
    SET tokens = jsonb_set(
      tokens,
      '{used}',
      to_jsonb((tokens->>'used')::int + NEW.amount)
    )
    WHERE id = NEW.subscription_id;
  ELSIF NEW.type IN ('purchase', 'bonus') THEN
    UPDATE subscriptions
    SET tokens = jsonb_set(
      tokens,
      '{remaining}',
      to_jsonb((tokens->>'remaining')::int + NEW.amount)
    )
    WHERE id = NEW.subscription_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for token updates
CREATE TRIGGER update_subscription_tokens_trigger
AFTER INSERT ON token_transactions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_tokens();