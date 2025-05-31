/*
# Create subscriptions and tokens tables

1. New Tables
  - `subscriptions`
    - `id` (uuid, primary key)
    - `company_id` (uuid, references companies)
    - `plan` (text)
    - `monthly_price` (jsonb)
    - `yearly_price` (jsonb)
    - `status` (text)
    - `applications` (jsonb)
    - `tokens` (jsonb)
    - `valid_until` (timestamptz)
    - Timestamps (created_at, updated_at)

  - `token_transactions`
    - `id` (uuid, primary key)
    - `subscription_id` (uuid, references subscriptions)
    - `company_id` (uuid, references companies)
    - `user_id` (uuid, references users)
    - `amount` (integer)
    - `type` (text)
    - `description` (text)
    - `metadata` (jsonb)
    - `timestamp` (timestamptz)

2. Security
  - Enable RLS on both tables
  - Add policies for:
    - Admins can read all subscriptions and transactions
    - Superadmins can read their company's subscriptions and transactions
    - System can create/update subscriptions and transactions
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  plan text NOT NULL,
  monthly_price jsonb NOT NULL DEFAULT '{"usd": 0, "cdf": 0}',
  yearly_price jsonb NOT NULL DEFAULT '{"usd": 0, "cdf": 0}',
  status text NOT NULL DEFAULT 'active',
  applications jsonb NOT NULL DEFAULT '[]',
  tokens jsonb NOT NULL DEFAULT '{"remaining": 0, "used": 0}',
  valid_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create token transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  amount integer NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can read company subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin'
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

CREATE POLICY "System can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for token transactions
CREATE POLICY "Admins can read all token transactions"
  ON token_transactions
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can read company token transactions"
  ON token_transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin'
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

CREATE POLICY "System can create token transactions"
  ON token_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create indexes
CREATE INDEX subscriptions_company_id_idx ON subscriptions(company_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX subscriptions_valid_until_idx ON subscriptions(valid_until);

CREATE INDEX token_transactions_subscription_id_idx ON token_transactions(subscription_id);
CREATE INDEX token_transactions_company_id_idx ON token_transactions(company_id);
CREATE INDEX token_transactions_user_id_idx ON token_transactions(user_id);
CREATE INDEX token_transactions_type_idx ON token_transactions(type);
CREATE INDEX token_transactions_timestamp_idx ON token_transactions(timestamp);

-- Create updated_at trigger for subscriptions
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();