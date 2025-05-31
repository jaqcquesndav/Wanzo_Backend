/*
  # Create Activities Table

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `company_id` (uuid, nullable)
      - `action` (text)
      - `description` (text)
      - `metadata` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for activity logging
*/

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

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        (u.role = 'superadmin' AND u.company_id = activities.company_id)
      )
    )
  );

CREATE POLICY "Users can create their own activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Create index for faster queries
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_timestamp ON activities(timestamp);