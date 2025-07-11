#!/usr/bin/env python
import sqlite3
import os
import sys
import django
import subprocess

def fix_database():
    """
    Directly fix the database schema to resolve the conflicting column issues
    """
    print("Starting direct database fix...")
    
    # Set up Django environment
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "comptable_ia_api.settings")
    django.setup()
    
    # Get database path from Django settings
    from django.conf import settings
    db_path = settings.DATABASES['default']['NAME']
    
    print(f"Working with database at: {db_path}")
    
    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if there's a duplicate column issue in api_tokenusage
        print("Inspecting api_tokenusage table...")
        cursor.execute("PRAGMA table_info(api_tokenusage)")
        columns = cursor.fetchall()
        
        column_names = [col[1] for col in columns]
        print(f"Current columns: {', '.join(column_names)}")
        
        # Check if both 'model' and 'model_name' exist
        if 'model' in column_names and 'model_name' in column_names:
            print("Found duplicate columns! The table has both 'model' and 'model_name' columns.")
            
            # Get all data from the table
            cursor.execute("SELECT * FROM api_tokenusage")
            rows = cursor.fetchall()
            
            # Create a new table with the correct schema
            print("Creating new table with correct schema...")
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
                metadata JSON NOT NULL DEFAULT '{}'
            )
            """)
            
            # Find the index positions of each column
            model_index = column_names.index('model')
            
            # Copy data to the new table
            print("Copying data to the new table...")
            for row in rows:
                # Build the insert statement dynamically based on the available columns
                cursor.execute(
                    """
                    INSERT INTO api_tokenusage_new
                    (message_id, user_id, operation_type, model, input_tokens, output_tokens, 
                    total_tokens, operation_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}')
                    """,
                    (row[0], row[1], row[2], row[model_index], row[4], row[5], row[6], row[7])
                )
            
            # Replace old table with new one
            print("Replacing old table with fixed version...")
            cursor.execute("DROP TABLE api_tokenusage")
            cursor.execute("ALTER TABLE api_tokenusage_new RENAME TO api_tokenusage")
            
            # Fake the migration to mark it as completed
            print("Setting migration as completed...")
            cursor.execute(
                """
                UPDATE django_migrations SET applied = datetime('now')
                WHERE app='api' AND name='0004_token_models_update'
                """
            )
            
            conn.commit()
            print("Database schema fix completed successfully!")
            
        else:
            print("No duplicate column issue found. The table structure looks fine.")
            
            # Check if migration is applied
            cursor.execute("SELECT applied FROM django_migrations WHERE app='api' AND name='0004_token_models_update'")
            result = cursor.fetchone()
            
            if not result:
                # Mark the migration as applied without actually doing it
                print("Marking migration as applied...")
                cursor.execute(
                    """
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('api', '0004_token_models_update', datetime('now'))
                    """
                )
                conn.commit()
                print("Migration marked as applied.")
            else:
                print("Migration already marked as applied.")
    
    except Exception as e:
        print(f"Error fixing database: {e}")
        conn.rollback()
    finally:
        conn.close()
    
    print("\nNow try running your Django server again with:")
    print("python manage.py runserver")

if __name__ == "__main__":
    fix_database()
