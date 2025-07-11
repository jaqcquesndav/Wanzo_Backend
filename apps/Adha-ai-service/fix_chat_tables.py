#!/usr/bin/env python
import os
import sys
import django
import sqlite3
import time

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')

# Skip model validation to avoid the conflict
os.environ['DJANGO_SKIP_MODEL_VALIDATION'] = 'True'

def fix_db():
    """
    Direct database fix for chat tables
    """
    try:
        # Get DB path from Django settings
        from django.conf import settings
        db_path = settings.DATABASES['default']['NAME']
        print(f"Working on database at: {db_path}")
    except:
        # If Django setup fails, try to locate the database file manually
        print("Couldn't get DB path from Django settings, searching for database file...")
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db.sqlite3')
        if not os.path.exists(db_path):
            db_path = input("Enter the path to your SQLite database file: ")
    
    if not os.path.exists(db_path):
        print(f"Database file not found at: {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'api_%';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Found tables: {', '.join(tables)}")
        
        # Create backup of existing tables if they exist
        if 'api_chatconversation' in tables:
            print("Creating backup of api_chatconversation...")
            cursor.execute("CREATE TABLE IF NOT EXISTS backup_api_chatconversation AS SELECT * FROM api_chatconversation;")
            
        if 'api_chatmessage' in tables:
            print("Creating backup of api_chatmessage...")
            cursor.execute("CREATE TABLE IF NOT EXISTS backup_api_chatmessage AS SELECT * FROM api_chatmessage;")
        
        # Drop problematic chat tables if they exist
        cursor.execute("DROP TABLE IF EXISTS api_chatmessage;")
        cursor.execute("DROP TABLE IF EXISTS api_chatconversation;")
        
        # Create conversation table with UUID primary key
        cursor.execute("""
        CREATE TABLE api_chatconversation (
            conversation_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES auth_user (id),
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL,
            company_context TEXT NOT NULL DEFAULT '{}'
        );
        """)
        
        # Create message table
        cursor.execute("""
        CREATE TABLE api_chatmessage (
            message_id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL REFERENCES api_chatconversation (conversation_id),
            is_user BOOLEAN NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            relevant_entries TEXT NOT NULL DEFAULT '[]'
        );
        """)
        
        # Add a migration record to django_migrations
        print("Adding migration record...")
        
        # Check if django_migrations table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='django_migrations';")
        migrations_table_exists = cursor.fetchone() is not None
        
        if migrations_table_exists:
            # Get the current time in Django migration format
            current_time = time.strftime('%Y-%m-%d %H:%M:%S.%f')
            
            # Add record for our custom migration
            cursor.execute(
                "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
                ('api', 'create_chat_models_manual_fix', current_time)
            )
            print("Added migration record to django_migrations table")
        else:
            print("django_migrations table doesn't exist, couldn't add migration record")
        
        conn.commit()
        print("\nDatabase tables created successfully!")
        print("\nNow you can run:")
        print("1. python manage.py check")
        print("2. python manage.py runserver")
        
    except Exception as e:
        conn.rollback()
        print(f"Error fixing database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    # Skip Django setup if model validation is causing problems
    if "--no-django-setup" in sys.argv:
        fix_db()
    else:
        try:
            django.setup()
            fix_db()
        except Exception as e:
            print(f"Django setup failed: {e}")
            print("Retrying without Django setup...")
            fix_db()
