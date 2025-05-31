/*
  # Create Payments Tables

  1. New Tables
    - `payment_methods`
      - `id` (uuid, primary key)
      - `company_id` (uuid)
      - `type` (text)
      - `provider` (text)
      - `details` (jsonb)
      - `active` (boolean)
      - Timestamps (created_at, updated_at)

    - `payments`
      - `id` (uuid, primary key)
      - `company_id` (uuid)
      - `amount` (jsonb)
      - `method_id` (uuid)
      - `description` (text)
      - `invoice_id` (text)
      - `status` (text)
      - `method` (jsonb)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for payment management
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

-- Enable Row Level Security
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_methods
CREATE POLICY "Users can view their company payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        u.company_id = payment_methods.company_id
      )
    )
  );

CREATE POLICY "Users can create payment methods for their company"
  ON payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        (u.role IN ('superadmin', 'manager') AND u.company_id = payment_methods.company_id)
      )
    )
  );

-- Create policies for payments
CREATE POLICY "Users can view their company payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        u.company_id = payments.company_id
      )
    )
  );

CREATE POLICY "Users can create payments for their company"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        (u.role IN ('superadmin', 'manager') AND u.company_id = payments.company_id)
      )
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX idx_payment_methods_type ON payment_methods(type);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider);
CREATE INDEX idx_payments_company_id ON payments(company_id);
CREATE INDEX idx_payments_method_id ON payments(method_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);