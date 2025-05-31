/*
  # Create Subscriptions Table

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `plan` (text)
      - `monthly_price` (jsonb with USD and CDF)
      - `yearly_price` (jsonb with USD and CDF)
      - `status` (text)
      - `applications` (jsonb array)
      - `tokens` (jsonb with remaining and used)
      - `valid_until` (timestamptz)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can read their company subscription
      - Superadmins can read their company subscription
      - Admins can read/write all subscriptions
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  plan text NOT NULL,
  monthly_price jsonb NOT NULL,
  yearly_price jsonb NOT NULL,
  status text NOT NULL,
  applications jsonb[] NOT NULL DEFAULT '{}',
  tokens jsonb NOT NULL DEFAULT '{"remaining": 0, "used": 0}',
  valid_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their company subscription" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.company_id = subscriptions.company_id
    )
  );

CREATE POLICY "Superadmins can read their company subscription" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'superadmin'
      AND u.company_id = subscriptions.company_id
    )
  );

CREATE POLICY "Admins can read/write all subscriptions" ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();