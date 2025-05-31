/*
  # Accounting Service Improvements

  1. New Tables
    - `exchange_rates`
      - Historical exchange rates tracking
      - Daily rates for multiple currencies
      - Base currency: CDF (Congolese Franc)
    
    - `financial_statement_notes`
      - Notes and annotations for financial statements
      - Support for both SYSCOHADA and IFRS standards
      - Links to accounts and statements
    
    - `chats`
      - Support for accounting assistance
      - Context and metadata storage
      - Message history tracking
    
    - `chat_messages`
      - Individual chat messages
      - Support for different roles (user/assistant)
      - Message content and metadata

  2. Changes to Existing Tables
    - `journals` and `journal_lines`
      - Added multi-currency support
      - Increased decimal precision
      - Added exchange rate tracking
      - Default currency: CDF

  3. Security
    - RLS policies for all new tables
    - Appropriate access controls based on user roles
*/

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text NOT NULL,
  currency_code text NOT NULL,
  rate_date date NOT NULL,
  rate_value decimal(20,6) NOT NULL,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id),
  created_by uuid
);

CREATE UNIQUE INDEX idx_exchange_rates_date_currency 
ON exchange_rates(currency_code, rate_date, COALESCE(company_id, '00000000-0000-0000-0000-000000000000'));

-- Create financial_statement_notes table
CREATE TABLE IF NOT EXISTS financial_statement_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text NOT NULL,
  fiscal_year text NOT NULL,
  framework text NOT NULL, -- 'SYSCOHADA' or 'IFRS'
  note_number text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  accounts text[] NOT NULL DEFAULT '{}',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id),
  created_by uuid
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text NOT NULL,
  title text NOT NULL,
  is_active boolean DEFAULT true,
  context jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id),
  created_by uuid
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id),
  role text NOT NULL,
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  source text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add currency and exchange rate columns to journals
ALTER TABLE journals 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'CDF',
ADD COLUMN IF NOT EXISTS exchange_rate decimal(20,6) DEFAULT 1;

-- Add currency and exchange rate columns to journal_lines
ALTER TABLE journal_lines 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'CDF',
ADD COLUMN IF NOT EXISTS exchange_rate decimal(20,6) DEFAULT 1,
ADD COLUMN IF NOT EXISTS original_debit decimal(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_credit decimal(20,2) DEFAULT 0;

-- Increase precision of amount columns
ALTER TABLE journal_lines
ALTER COLUMN debit TYPE decimal(20,2),
ALTER COLUMN credit TYPE decimal(20,2);

ALTER TABLE journals
ALTER COLUMN total_debit TYPE decimal(20,2),
ALTER COLUMN total_credit TYPE decimal(20,2);

-- Enable RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_statement_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exchange_rates
CREATE POLICY "Users can view exchange rates for their company"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NULL OR
    company_id IN (
      SELECT c.id FROM companies c
      WHERE c.id = auth.uid()
    )
  );

CREATE POLICY "Only admins can create exchange rates"
  ON exchange_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'accountant')
  );

-- RLS Policies for financial_statement_notes
CREATE POLICY "Users can view notes for their company"
  ON financial_statement_notes
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id FROM companies c
      WHERE c.id = auth.uid()
    )
  );

CREATE POLICY "Only admins and accountants can manage notes"
  ON financial_statement_notes
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'accountant') AND
    company_id IN (
      SELECT c.id FROM companies c
      WHERE c.id = auth.uid()
    )
  );

-- RLS Policies for chats
CREATE POLICY "Users can view their company's chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id FROM companies c
      WHERE c.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company's chats"
  ON chats
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id FROM companies c
      WHERE c.id = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from their company's chats"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT c.id FROM chats c
      WHERE c.company_id IN (
        SELECT co.id FROM companies co
        WHERE co.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add messages to their company's chats"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (
      SELECT c.id FROM chats c
      WHERE c.company_id IN (
        SELECT co.id FROM companies co
        WHERE co.id = auth.uid()
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_exchange_rates_company ON exchange_rates(company_id);
CREATE INDEX idx_financial_statement_notes_company ON financial_statement_notes(company_id);
CREATE INDEX idx_financial_statement_notes_fiscal_year ON financial_statement_notes(fiscal_year);
CREATE INDEX idx_chats_company ON chats(company_id);
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX idx_journals_currency ON journals(currency);
CREATE INDEX idx_journal_lines_currency ON journal_lines(currency);