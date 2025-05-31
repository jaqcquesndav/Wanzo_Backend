/*
  # Create updated_at function

  1. Function
    - Creates a trigger function to automatically update updated_at timestamp
    - Used by all tables that need updated_at tracking
*/

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;