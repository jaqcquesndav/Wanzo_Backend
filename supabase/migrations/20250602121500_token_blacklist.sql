-- Create token blacklist table for handling revoked tokens
CREATE TABLE IF NOT EXISTS "token_blacklist" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "jti" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "reason" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for quick lookups
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_user_id" ON "token_blacklist" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_jti" ON "token_blacklist" ("jti");
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_expires_at" ON "token_blacklist" ("expires_at");

-- Add composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_jti_user_id" ON "token_blacklist" ("jti", "user_id");
