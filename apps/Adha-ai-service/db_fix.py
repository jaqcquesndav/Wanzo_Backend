import sqlite3
import os
import django
import sys

# Set up Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
django.setup()

from django.conf import settings

def fix_database():
    """
    Fix database tables directly if migrations aren't working.
    """
    db_path = settings.DATABASES['default']['NAME']
    print(f"Fixing database at: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'api_%';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Found tables: {', '.join(tables)}")
        
        # Backup existing data
        print("Creating backup tables...")
        if 'api_chatconversation' in tables:
            cursor.execute("CREATE TABLE IF NOT EXISTS backup_api_chatconversation AS SELECT * FROM api_chatconversation;")
        if 'api_chatmessage' in tables:
            cursor.execute("CREATE TABLE IF NOT EXISTS backup_api_chatmessage AS SELECT * FROM api_chatmessage;")
        
        # Drop and recreate tables with correct schema
        print("Recreating tables with correct schema...")
        cursor.execute("DROP TABLE IF EXISTS api_chatmessage;")
        cursor.execute("DROP TABLE IF EXISTS api_chatconversation;")
        
        # Create conversation table with UUID as primary key
        cursor.execute("""
        CREATE TABLE api_chatconversation (
            conversation_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES auth_user (id),
            title TEXT NOT NULL,
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
        
        conn.commit()
        print("Database tables recreated successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error fixing database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database()
    print("Run 'python manage.py migrate --fake' next to mark migrations as applied")
