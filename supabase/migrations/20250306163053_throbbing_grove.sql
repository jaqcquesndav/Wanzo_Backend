/*
  # Create Documents Table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid)
      - `type` (text)
      - `name` (text)
      - `cloudinary_id` (text)
      - `url` (text)
      - `description` (text)
      - `status` (text)
      - `expiry_date` (timestamptz)
      - `rejection_reason` (text)
      - `metadata` (jsonb)
      - `uploaded_by` (uuid)
      - `reviewed_by` (uuid)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for document management
*/

-- Create enum for document types
CREATE TYPE document_type AS ENUM (
  'rccm',
  'idnat',
  'nif',
  'cnss',
  'other'
);

-- Create enum for document status
CREATE TYPE document_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  type document_type NOT NULL,
  name text NOT NULL,
  cloudinary_id text NOT NULL,
  url text NOT NULL,
  description text,
  status document_status NOT NULL DEFAULT 'pending',
  expiry_date timestamptz,
  rejection_reason text,
  metadata jsonb,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        u.company_id = documents.company_id
      )
    )
  );

CREATE POLICY "Users can upload documents to their company"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        (u.role IN ('superadmin', 'manager') AND u.company_id = documents.company_id)
      )
    )
  );

CREATE POLICY "Admins and managers can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        (u.role IN ('superadmin', 'manager') AND u.company_id = documents.company_id)
      )
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);