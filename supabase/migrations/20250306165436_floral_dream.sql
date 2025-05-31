/*
  # Create documents table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `type` (enum)
      - `name` (text)
      - `cloudinary_id` (text)
      - `url` (text)
      - `description` (text)
      - `status` (enum)
      - `expiry_date` (timestamptz)
      - `rejection_reason` (text)
      - `metadata` (jsonb)
      - `uploaded_by` (uuid, foreign key)
      - `reviewed_by` (uuid, foreign key)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for document access
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
CREATE POLICY "Users can view their company documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Admins can view all documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();