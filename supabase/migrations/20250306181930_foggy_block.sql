/*
# Create chat system tables

1. New Tables
  - `chats`
    - `id` (uuid, primary key)
    - `company_id` (uuid, references companies)
    - `user_id` (uuid, references users)
    - `title` (text)
    - `context` (jsonb) - Contexte métier pour l'IA
    - `status` (text)
    - `metadata` (jsonb)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  - `chat_messages`
    - `id` (uuid, primary key)
    - `chat_id` (uuid, references chats)
    - `role` (text) - 'user', 'assistant', ou 'system'
    - `content` (text)
    - `tokens_used` (integer)
    - `metadata` (jsonb) - Citations, sources, etc.
    - `created_at` (timestamptz)

2. Security
  - Enable RLS on both tables
  - Add policies for:
    - Users can read/write their own chats and messages
    - Admins can read all chats and messages
    - System can create/update chats and messages
*/

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  context jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chats
CREATE POLICY "Users can read own chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can create own chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON chats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for chat messages
CREATE POLICY "Users can read messages from own chats"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND (chats.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
    )
  );

CREATE POLICY "Users can create messages in own chats"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX chats_user_id_idx ON chats(user_id);
CREATE INDEX chats_company_id_idx ON chats(company_id);
CREATE INDEX chats_status_idx ON chats(status);
CREATE INDEX chat_messages_chat_id_idx ON chat_messages(chat_id);
CREATE INDEX chat_messages_role_idx ON chat_messages(role);
CREATE INDEX chat_messages_created_at_idx ON chat_messages(created_at);

-- Create updated_at trigger for chats
CREATE TRIGGER set_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();