/*
  # Create Documents Table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `type` (enum: rccm, idnat, nif, cnss, other)
      - `name` (text)
      - `cloudinary_id` (text)
      - `url` (text)
      - `description` (text)
      - `status` (enum: pending, approved, rejected, expired)
      - `expiry_date` (timestamptz)
      - `rejection_reason` (text)
      - `metadata` (jsonb)
      - `uploaded_by` (uuid, references users)
      - `reviewed_by` (uuid, references users)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can read their company documents
      - Superadmins can read/write their company documents
      - Admins can read/write all documents
*/

-- Create document type enum
CREATE TYPE document_type AS ENUM ('rccm', 'idnat', 'nif', 'cnss', 'other');

-- Create document status enum
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

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

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their company documents" ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.company_id = documents.company_id
    )
  );

CREATE POLICY "Superadmins can read/write their company documents" ON documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'superadmin'
      AND u.company_id = documents.company_id
    )
  );

CREATE POLICY "Admins can read/write all documents" ON documents
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
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();