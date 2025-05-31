/*
  # Create Documents Table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `type` (enum)
      - `name` (text)
      - `cloudinary_id` (text)
      - `url` (text)
      - `status` (enum)
      - `metadata` (jsonb)
      - `uploaded_by` (uuid, foreign key)
      - `reviewed_by` (uuid, foreign key)
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can read company documents
      - Admins can manage all documents
      - Superadmins can manage company documents
*/

-- Create document type enum
CREATE TYPE document_type AS ENUM (
  'rccm',
  'idnat',
  'nif',
  'cnss',
  'other'
);

-- Create document status enum
CREATE TYPE document_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  type document_type NOT NULL,
  name text NOT NULL,
  cloudinary_id text NOT NULL,
  url text NOT NULL,
  description text,
  status document_status NOT NULL DEFAULT 'pending',
  expiry_date timestamptz,
  rejection_reason text,
  metadata jsonb,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read company documents" ON documents
  FOR SELECT
  TO authenticated
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all documents" ON documents
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can manage company documents" ON documents
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin' 
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

-- Create indexes
CREATE INDEX documents_company_id_idx ON documents(company_id);
CREATE INDEX documents_type_idx ON documents(type);
CREATE INDEX documents_status_idx ON documents(status);
CREATE INDEX documents_uploaded_by_idx ON documents(uploaded_by);