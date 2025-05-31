/*
# Create activities table

1. New Tables
  - `activities`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users)
    - `company_id` (uuid, references companies)
    - `action` (text)
    - `description` (text)
    - `metadata` (jsonb)
    - `ip_address` (text)
    - `user_agent` (text)
    - `timestamp` (timestamptz)

2. Security
  - Enable RLS on `activities` table
  - Add policies for:
    - Admins can read all activities
    - Superadmins can read company activities
    - Users can read their own activities
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
CREATE POLICY "Admins can read all activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can read company activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin'
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

CREATE POLICY "Users can read own activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX activities_user_id_idx ON activities(user_id);
CREATE INDEX activities_company_id_idx ON activities(company_id);
CREATE INDEX activities_action_idx ON activities(action);
CREATE INDEX activities_timestamp_idx ON activities(timestamp);