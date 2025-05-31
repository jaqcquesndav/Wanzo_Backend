/*
  # Create Updated At Function

  Creates a function to automatically update the updated_at timestamp
  when a row is modified. This function is used by triggers on all tables
  that have an updated_at column.
*/

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;