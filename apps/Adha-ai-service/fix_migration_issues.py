"""
Comprehensive script to fix all migration issues.
"""
import os
import sys
import sqlite3
import re

def main():
    print("Migration Fix Script - Running...")
    
    db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        return False
        
    try:
        print(f"Connecting to SQLite database at {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables first
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        tables = [table[0] for table in tables]
        
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")
        
        if 'django_migrations' in tables:
            # Check existing migrations for the api app
            cursor.execute("SELECT name FROM django_migrations WHERE app='api';")
            migrations = cursor.fetchall()
            migrations = [m[0] for m in migrations]
            
            print(f"Current api migrations: {migrations}")
            
            # Remove any problematic migrations
            if 'fix_uuid_migration' in migrations:
                print("Removing problematic migration 'fix_uuid_migration'")
                cursor.execute("DELETE FROM django_migrations WHERE app='api' AND name='fix_uuid_migration';")
            
            # Clean up ChatMessage table if it exists
            if 'api_chatmessage' in tables:
                print("Cleaning up ChatMessage table")
                cursor.execute("DELETE FROM api_chatmessage;")
            
        # Commit changes
        conn.commit()
        print("Database prepared for fresh migrations.")
        
        # Look for the fix_uuid_migration.py file and remove it
        migration_path = os.path.join(os.path.dirname(__file__), 'api', 'migrations', 'fix_uuid_migration.py')
        if os.path.exists(migration_path):
            try:
                os.remove(migration_path)
                print(f"Removed problematic migration file: {migration_path}")
            except Exception as e:
                print(f"Could not remove migration file: {e}")
                
        print("\nNext steps:")
        print("1. Run 'python manage.py makemigrations' to create any needed migrations")
        print("2. Run 'python manage.py migrate' to apply migrations")
        
        return True
    
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
