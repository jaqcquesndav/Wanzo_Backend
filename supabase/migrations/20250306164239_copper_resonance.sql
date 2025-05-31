/*
  # Create Payments Tables

  1. New Tables
    - `payment_methods`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `type` (text)
      - `provider` (text)
      - `details` (jsonb)
      - `active` (boolean)
      - Timestamps (created_at, updated_at)

    - `payments`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `amount` (jsonb with USD and CDF)
      - `method_id` (uuid, references payment_methods)
      - `description` (text)
      - `invoice_id` (text)
      - `status` (text)
      - `method` (jsonb with payment method details)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can read their company payments
      - Superadmins can read/write their company payments
      - Admins can read/write all payments
*/

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  type text NOT NULL,
  provider text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
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
CREATE POLICY "Users can read their company payment methods" ON payment_methods
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.company_id = payment_methods.company_id
    )
  );

CREATE POLICY "Superadmins can read/write their company payment methods" ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'superadmin'
      AND u.company_id = payment_methods.company_id
    )
  );

CREATE POLICY "Admins can read/write all payment methods" ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Create policies for payments
CREATE POLICY "Users can read their company payments" ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.company_id = payments.company_id
    )
  );

CREATE POLICY "Superadmins can read/write their company payments" ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'superadmin'
      AND u.company_id = payments.company_id
    )
  );

CREATE POLICY "Admins can read/write all payments" ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Create updated_at triggers
CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();