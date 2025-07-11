#!/usr/bin/env python
import os
import sys
import subprocess

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
import django
django.setup()

from django.db import connection

def show_migrations():
    """Show current migration status."""
    print("\n===== Current Migration Status =====")
    subprocess.run(["python", "manage.py", "showmigrations", "api"])

def fix_migration_state():
    """Force Django to recognize that migrations have been applied."""
    print("\n===== Fixing Migration State =====")
    
    # Check if tables exist already
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'api_%';")
        existing_tables = [row[0] for row in cursor.fetchall()]
    
    print(f"Existing tables: {existing_tables}")
    
    # Check if the JournalEntry table exists but migration record doesn't
    if 'api_journalentry' in existing_tables:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM django_migrations WHERE app='api' AND name='0001_initial';")
            if not cursor.fetchone():
                print("Adding missing migration record for 0001_initial")
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, datetime('now'))",
                    ['api', '0001_initial']
                )
    
    # Apply chat models migration with --fake if tables already exist
    chat_tables = ['api_chatconversation', 'api_chatmessage']
    should_fake = any(table in existing_tables for table in chat_tables)
    
    if should_fake:
        print("Chat tables already exist, applying migration with --fake")
        subprocess.run(["python", "manage.py", "migrate", "api", "0002_create_chat_models", "--fake"])
    else:
        print("Chat tables don't exist, applying normal migration")
        subprocess.run(["python", "manage.py", "migrate", "api", "0002_create_chat_models"])

def main():
    """Main function."""
    show_migrations()
    fix_migration_state()
    show_migrations()
    
    print("\nMigration fix process completed.")
    print("If issues persist, you may need to use Django's squashmigrations or manually edit the migration state.")

if __name__ == "__main__":
    main()

"""
Script to fix migration issues related to the ChatMessage UUID fields.
Run this script when you encounter UNIQUE constraint errors during migrations.
"""
import os
import sys
import sqlite3
from pathlib import Path

def setup_sqlite3():
    """Make sure SQLite3 is set up before running this script."""
    import setup_sqlite3
    if not setup_sqlite3.main():
        print("Cannot proceed without SQLite3. Please install it manually.")
        sys.exit(1)

def fix_migrations():
    """Fix the migration issues with ChatMessage UUIDs."""
    db_path = Path(__file__).parent / 'db.sqlite3'
    
    if not db_path.exists():
        print(f"Database file not found at {db_path}")
        return False
    
    print(f"Connecting to database at {db_path}")
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        print("Checking for existing tables...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='api_chatmessage'")
        if cursor.fetchone():
            # Create a backup table if it doesn't exist
            print("Creating backup of ChatMessage table...")
            cursor.execute("CREATE TABLE IF NOT EXISTS api_chatmessage_backup AS SELECT * FROM api_chatmessage")
            
            # Delete the problematic records from the original table
            print("Clearing the ChatMessage table to resolve UUID conflicts...")
            cursor.execute("DELETE FROM api_chatmessage")
            
            # Remove the migration record so it can be reapplied
            print("Updating migration records...")
            cursor.execute("DELETE FROM django_migrations WHERE app='api' AND name='0004_alter_chatconversation_options_and_more'")
            
            # Commit the changes
            conn.commit()
            print("Database prepared for fresh migration.")
            print("Now you can run 'python manage.py migrate' to apply migrations cleanly.")
        else:
            print("The api_chatmessage table doesn't exist yet. No action needed.")
        
        return True
    
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return False
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False
    
    finally:
        if conn:
            conn.close()

def main():
    setup_sqlite3()
    
    print("\n" + "=" * 60)
    print("Django Migration Fixer Tool".center(60))
    print("=" * 60 + "\n")
    
    print("This tool will help fix migration issues with UUID fields in the ChatMessage model.")
    print("WARNING: This will delete any existing ChatMessage data to resolve conflicts.")
    print("\nDo you want to proceed? (yes/no)")
    
    answer = input("> ").strip().lower()
    if answer != 'yes':
        print("Operation cancelled.")
        return
    
    if fix_migrations():
        print("\nSuccess! Now run: python manage.py migrate")
    else:
        print("\nFailed to fix migrations.")
        print("You might need to manually fix the database using these SQL commands:")
        print("\n  DELETE FROM api_chatmessage;")
        print("  DELETE FROM django_migrations WHERE app='api' AND name='0004_alter_chatconversation_options_and_more';")

if __name__ == "__main__":
    main()
