"""
Quick script to fix the ChatMessage UUID issue.
Run this when migrations are failing due to ChatMessage UUID constraints.
"""
import sqlite3
import os
import uuid
from pathlib import Path

DB_PATH = Path(__file__).parent / 'db.sqlite3'

def fix_migration_issue():
    print(f"Connecting to database at {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    try:
        # Check if we have the ChatMessage table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='api_chatmessage'")
        if cursor.fetchone():
            print("Creating backup of api_chatmessage table...")
            # Create a backup of the table first
            cursor.execute("CREATE TABLE IF NOT EXISTS api_chatmessage_backup AS SELECT * FROM api_chatmessage")
            
            # Delete all records from the original table
            print("Clearing api_chatmessage table...")
            cursor.execute("DELETE FROM api_chatmessage")
            
            # Fix the migration records
            print("Fixing migration records...")
            cursor.execute("DELETE FROM django_migrations WHERE app='api' AND name='0004_alter_chatconversation_options_and_more'")
            
            # Commit the changes
            conn.commit()
            print("Changes committed. Now run 'python manage.py migrate' to apply migrations cleanly.")
        else:
            print("Table api_chatmessage not found. No action needed.")
    
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_migration_issue()
