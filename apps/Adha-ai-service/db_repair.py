#!/usr/bin/env python
import sqlite3
import os
import sys

def get_db_path():
    """Get the SQLite database path from Django settings."""
    # Since we're not using Django (to avoid the circular import issue),
    # let's look for the database file in standard locations
    possible_paths = [
        os.path.join(os.path.dirname(__file__), 'db.sqlite3'),
        os.path.join(os.path.dirname(__file__), 'comptable_ia_api', 'db.sqlite3')
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # If we can't find it automatically, ask the user
    db_path = input("Enter the path to your SQLite database file: ")
    if os.path.exists(db_path):
        return db_path
    else:
        print(f"Database file not found at: {db_path}")
        sys.exit(1)

def fix_database():
    db_path = get_db_path()
    print(f"Using database at: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'api_%';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Found tables: {', '.join(tables)}")
        
        # Create backup tables
        print("Creating backup tables...")
        if 'api_chatconversation' in tables:
            cursor.execute("CREATE TABLE IF NOT EXISTS backup_api_chatconversation AS SELECT * FROM api_chatconversation;")
            print("Backed up chat conversations")
        
        if 'api_chatmessage' in tables:
            cursor.execute("CREATE TABLE IF NOT EXISTS backup_api_chatmessage AS SELECT * FROM api_chatmessage;")
            print("Backed up chat messages")
        
        # Drop problematic tables if they exist
        if 'api_chatmessage' in tables:
            cursor.execute("DROP TABLE api_chatmessage;")
            print("Dropped api_chatmessage table")
        
        if 'api_chatconversation' in tables:
            cursor.execute("DROP TABLE api_chatconversation;")
            print("Dropped api_chatconversation table")
        
        # Create tables with correct schema
        print("Creating chat conversation table...")
        cursor.execute("""
        CREATE TABLE api_chatconversation (
            conversation_id TEXT PRIMARY KEY NOT NULL,
            user_id INTEGER NOT NULL REFERENCES auth_user (id),
            title VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            company_context TEXT NOT NULL
        );
        """)
        
        print("Creating chat message table...")
        cursor.execute("""
        CREATE TABLE api_chatmessage (
            message_id TEXT PRIMARY KEY NOT NULL,
            conversation_id TEXT NOT NULL REFERENCES api_chatconversation (conversation_id),
            is_user BOOLEAN NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            relevant_entries TEXT NOT NULL
        );
        """)
        
        # Add the django_migrations entry for these tables 
        # This will mark the tables as created so Django doesn't try to create them again
        print("Adding migration record...")
        
        # Check if a migration exists for these models
        cursor.execute("SELECT app, name FROM django_migrations WHERE app = 'api' AND name LIKE '%chat%';")
        existing_migrations = cursor.fetchall()
        
        if not existing_migrations:
            # Get the latest migration applied
            cursor.execute("SELECT app, name FROM django_migrations WHERE app = 'api' ORDER BY id DESC LIMIT 1;")
            latest = cursor.fetchone()
            
            if latest:
                # Add a fake migration record for our chat models
                migration_name = f"create_chat_models_manual_fix"
                cursor.execute("INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, CURRENT_TIMESTAMP);", 
                             ('api', migration_name))
                print(f"Added migration record: api.{migration_name}")
            else:
                print("No previous migrations found. You'll need to run 'python manage.py migrate --fake-initial api'")
        
        conn.commit()
        print("Database tables fixed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error fixing database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database()
    print("\nRun these commands next:")
    print("1. python manage.py migrate --fake api")
    print("2. python manage.py migrate --fake")
