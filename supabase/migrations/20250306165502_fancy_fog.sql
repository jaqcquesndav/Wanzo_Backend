/*
  # Create subscriptions table

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `plan` (text)
      - `monthly_price` (jsonb)
      - `yearly_price` (jsonb)
      - `status` (text)
      - `applications` (jsonb array)
      - `tokens` (jsonb)
      - `valid_until` (timestamptz)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for subscription access
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  plan text NOT NULL,
  monthly_price jsonb NOT NULL,
  yearly_price jsonb NOT NULL,
  status text NOT NULL,
  applications jsonb[] NOT NULL DEFAULT '{}',
  tokens jsonb NOT NULL,
  valid_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();