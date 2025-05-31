/*
  # Add Currency Support
  
  1. Changes
    - Add currency configuration table
    - Add currency columns to relevant tables
    - Set CDF as default currency
    - Add currency conversion rates table
    
  2. Default Values
    - Default currency is set to CDF (Franc Congolais)
    - All monetary amounts will be stored in CDF
    - Exchange rates will be tracked against CDF
*/

-- Create currency configuration table
CREATE TABLE IF NOT EXISTS currency_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(3) NOT NULL UNIQUE,
  name varchar(50) NOT NULL,
  symbol varchar(5) NOT NULL,
  is_default boolean DEFAULT false,
  decimal_places smallint DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency varchar(3) NOT NULL,
  to_currency varchar(3) NOT NULL,
  rate decimal(20,6) NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_currency, to_currency, valid_from)
);

-- Add currency columns to journal entries
ALTER TABLE journals 
ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'CDF',
ADD COLUMN IF NOT EXISTS exchange_rate decimal(20,6) DEFAULT 1.0;

ALTER TABLE journal_lines
ADD COLUMN IF NOT EXISTS original_debit decimal(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_credit decimal(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'CDF',
ADD COLUMN IF NOT EXISTS exchange_rate decimal(20,6) DEFAULT 1.0;

-- Insert default currency (CDF)
INSERT INTO currency_config 
(code, name, symbol, is_default, decimal_places)
VALUES 
('CDF', 'Franc Congolais', 'FC', true, 2)
ON CONFLICT (code) DO NOTHING;

-- Add commonly used currencies
INSERT INTO currency_config 
(code, name, symbol, is_default, decimal_places)
VALUES 
('USD', 'US Dollar', '$', false, 2),
('EUR', 'Euro', '€', false, 2)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE currency_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Public read access to currency config"
  ON currency_config
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage currency config"
  ON currency_config
  USING (auth.role() = 'admin');

CREATE POLICY "Public read access to exchange rates"
  ON exchange_rates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage exchange rates"
  ON exchange_rates
  USING (auth.role() = 'admin');