#!/usr/bin/env python
import os
import sqlite3
import sys

def check_db_schema():
    """
    Checks the actual database schema to help debug migration issues
    """
    try:
        # Get the database file path from Django settings
        import django
        from django.conf import settings

        # Add the project directory to Python path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.append(base_dir)
        
        # Set up Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
        django.setup()
        
        db_path = settings.DATABASES['default']['NAME']
        print(f"Database path: {db_path}")
        
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get a list of all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = cursor.fetchall()
        print(f"Found {len(tables)} tables: {', '.join([t[0] for t in tables])}")
        
        # Check specific tables where we're having issues
        problem_tables = ['api_tokenquota', 'api_tokenusage']
        
        for table in problem_tables:
            try:
                cursor.execute(f"PRAGMA table_info({table});")
                columns = cursor.fetchall()
                
                print(f"\nTable: {table}")
                print("Columns:")
                for col in columns:
                    col_id, col_name, col_type, col_notnull, col_default, col_pk = col
                    print(f"  {col_name} ({col_type}{'PRIMARY KEY' if col_pk else ''})")
                    
            except Exception as e:
                print(f"Error inspecting table {table}: {e}")
                
        conn.close()
        
    except Exception as e:
        print(f"Error checking database schema: {e}")
        return False

if __name__ == "__main__":
    check_db_schema()
