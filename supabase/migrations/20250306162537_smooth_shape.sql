/*
  # Create Settings Table

  1. New Tables
    - `settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `description` (text)
      - `is_public` (boolean)
      - `is_system` (boolean)
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for:
      - Anyone can read public settings
      - Admins can manage all settings
*/

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
CREATE POLICY "Anyone can read public settings" ON settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON settings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes
CREATE INDEX settings_key_idx ON settings(key);
CREATE INDEX settings_is_public_idx ON settings(is_public);