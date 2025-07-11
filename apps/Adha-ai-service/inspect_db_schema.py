#!/usr/bin/env python
import sqlite3
import os
import sys

def inspect_db_schema():
    """
    Inspects the database schema to identify column issues
    """
    try:
        # Set up Django to get the database path
        import django
        from django.conf import settings
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
        django.setup()
        
        db_path = settings.DATABASES['default']['NAME']
        print(f"Database path: {db_path}")
        
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check the structure of the api_tokenusage table
        cursor.execute("PRAGMA table_info(api_tokenusage);")
        columns = cursor.fetchall()
        
        print("\nTable: api_tokenusage")
        print("Columns:")
        column_names = []
        for col in columns:
            col_id, col_name, col_type, col_notnull, col_default, col_pk = col
            column_names.append(col_name)
            print(f"  {col_name} ({col_type})")
        
        # Check for both model and model_name columns
        if 'model' in column_names and 'model_name' in column_names:
            print("\nISSUE DETECTED: Both 'model' and 'model_name' columns exist in api_tokenusage table")
            
            # Ask user if they want to fix this issue
            fix_it = input("\nWould you like to fix this issue by dropping the 'model_name' column? (y/n): ")
            if fix_it.lower() == 'y':
                # Create new table without the duplicate column
                cursor.execute("""
                CREATE TABLE api_tokenusage_new (
                    message_id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    operation_type TEXT NOT NULL,
                    model TEXT NOT NULL,
                    input_tokens INTEGER NOT NULL,
                    output_tokens INTEGER NOT NULL,
                    total_tokens INTEGER NOT NULL,
                    operation_id TEXT NOT NULL,
                    metadata JSON NOT NULL
                );
                """)
                
                # Copy data to new table
                cursor.execute("""
                INSERT INTO api_tokenusage_new 
                SELECT message_id, user_id, operation_type, model, input_tokens, 
                       output_tokens, total_tokens, operation_id, metadata
                FROM api_tokenusage;
                """)
                
                # Drop old table and rename new one
                cursor.execute("DROP TABLE api_tokenusage;")
                cursor.execute("ALTER TABLE api_tokenusage_new RENAME TO api_tokenusage;")
                
                conn.commit()
                print("Fixed the duplicate column issue successfully!")
        else:
            print("\nNo duplicate column issue detected.")
        
        # Also check the TokenQuota table since we had issues with it
        cursor.execute("PRAGMA table_info(api_tokenquota);")
        columns = cursor.fetchall()
        
        print("\nTable: api_tokenquota")
        print("Columns:")
        for col in columns:
            col_id, col_name, col_type, col_notnull, col_default, col_pk = col
            print(f"  {col_name} ({col_type})")
        
        conn.close()
        
    except Exception as e:
        print(f"Error inspecting schema: {e}")

if __name__ == "__main__":
    inspect_db_schema()
