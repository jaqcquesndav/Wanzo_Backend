/*
# Create settings table

1. New Tables
  - `settings`
    - `id` (uuid, primary key)
    - `key` (text, unique)
    - `value` (jsonb)
    - `description` (text)
    - `is_public` (boolean)
    - `is_system` (boolean)
    - Timestamps (created_at, updated_at)

2. Security
  - Enable RLS on `settings` table
  - Add policies for:
    - Anyone can read public settings
    - Admins can read all settings
    - Admins can create/update settings
*/

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read public settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can read all settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can create settings"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete settings"
  ON settings
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND is_system = false
  );

-- Create indexes
CREATE INDEX settings_key_idx ON settings(key);
CREATE INDEX settings_is_public_idx ON settings(is_public);

-- Create updated_at trigger
CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();