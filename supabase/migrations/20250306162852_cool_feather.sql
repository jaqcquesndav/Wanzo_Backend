/*
  # Create Activities Table

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
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR (u.role = 'superadmin' AND u.company_id = activities.company_id))
    )
  );

CREATE POLICY "System can create activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);