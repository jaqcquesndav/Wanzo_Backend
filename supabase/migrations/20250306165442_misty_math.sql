/*
  # Create activities table

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `company_id` (uuid, foreign key)
      - `action` (text)
      - `description` (text)
      - `metadata` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for activity access
*/

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  company_id uuid REFERENCES companies(id),
  action text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  ip_address text,
  user_agent text,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can view company activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin'
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

CREATE POLICY "Admins can view all activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');