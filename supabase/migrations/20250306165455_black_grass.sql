/*
  # Create payments tables

  1. New Tables
    - `payment_methods`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `type` (text)
      - `provider` (text)
      - `details` (jsonb)
      - `active` (boolean)
      - Timestamps (created_at, updated_at)

    - `payments`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `amount` (jsonb)
      - `method_id` (uuid, foreign key)
      - `description` (text)
      - `invoice_id` (text)
      - `status` (text)
      - `method` (jsonb)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for payment access
*/

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  type text NOT NULL,
  provider text NOT NULL,
  details jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  amount jsonb NOT NULL,
  method_id uuid NOT NULL REFERENCES payment_methods(id),
  description text NOT NULL,
  invoice_id text,
  status text NOT NULL,
  method jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_methods
CREATE POLICY "Users can view their company payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Create policies for payments
CREATE POLICY "Users can view their company payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Create updated_at triggers
CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();