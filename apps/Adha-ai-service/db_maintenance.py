#!/usr/bin/env python
"""
Django Database Maintenance Utility

This script consolidates various database maintenance functions that were previously
spread across multiple scripts in the project. It provides a unified interface for:
- Cleaning cache files
- Managing migrations
- Fixing database issues
- Checking database structure
- Resetting the database when needed

Usage:
    python db_maintenance.py [command]

Commands:
    clean_cache          - Remove Python cache files and directories
    clean_migrations     - Remove migration files (except __init__.py)
    fix_migrations       - Fix migration state issues
    check_db             - Check database structure and tables
    fix_db               - Fix database issues (migrations, tables, etc.)
    reset_db             - Reset the database completely (CAUTION: data loss)
    all                  - Run all maintenance operations in sequence

Examples:
    python db_maintenance.py clean_cache
    python db_maintenance.py fix_migrations
    python db_maintenance.py --help
"""

import os
import sys
import shutil
import sqlite3
import re
import importlib
import subprocess
from datetime import datetime
from pathlib import Path

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
try:
    import django
    django.setup()
    from django.db import connection
except ImportError:
    print("WARNING: Django could not be imported. Some functions may not work.")
except Exception as e:
    print(f"WARNING: Django setup failed: {e}. Some functions may not work.")

# Constants
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = Path(BASE_DIR) / 'db.sqlite3'
MIGRATIONS_DIR = os.path.join('api', 'migrations')

def show_migrations():
    """Show current migration status."""
    print("\n===== Current Migration Status =====")
    try:
        subprocess.run(["python", "manage.py", "showmigrations", "api"])
    except Exception as e:
        print(f"Error showing migrations: {e}")

def clean_cache():
    """Clean Python cache files and directories."""
    print("\n===== Cleaning Python Cache Files =====")
    
    pyc_count = pycache_count = 0
    for root, dirs, files in os.walk(BASE_DIR):
        # Remove __pycache__ directories
        if '__pycache__' in dirs:
            pycache_path = os.path.join(root, '__pycache__')
            try:
                shutil.rmtree(pycache_path)
                pycache_count += 1
                print(f"Removed: {pycache_path}")
            except Exception as e:
                print(f"Error removing {pycache_path}: {e}")
            dirs.remove('__pycache__')
            
        # Remove .pyc files
        for file in files:
            if file.endswith('.pyc'):
                pyc_path = os.path.join(root, file)
                try:
                    os.unlink(pyc_path)
                    pyc_count += 1
                    print(f"Removed: {pyc_path}")
                except Exception as e:
                    print(f"Error removing {pyc_path}: {e}")
    
    print(f"Removed {pycache_count} __pycache__ directories and {pyc_count} .pyc files")
    return pyc_count + pycache_count

def clean_migrations():
    """
    Deletes all migration files except __init__.py and recreates
    an empty __init__.py file if it doesn't exist.
    """
    print("\n===== Cleaning Migration Files =====")
    
    # Ensure migrations directory exists
    os.makedirs(MIGRATIONS_DIR, exist_ok=True)
    
    # Delete all files in migrations directory except __init__.py
    count = 0
    for filename in os.listdir(MIGRATIONS_DIR):
        file_path = os.path.join(MIGRATIONS_DIR, filename)
        if filename != '__init__.py' and os.path.isfile(file_path):
            os.unlink(file_path)
            count += 1
            print(f"Deleted {file_path}")
    
    # Ensure __init__.py exists
    init_path = os.path.join(MIGRATIONS_DIR, '__init__.py')
    if not os.path.exists(init_path):
        with open(init_path, 'w') as f:
            pass
        print(f"Created {init_path}")
    
    print(f"Cleaned {count} migration files")
    return count

def clean_db():
    """Delete the SQLite database file if it exists."""
    print("\n===== Cleaning Database =====")
    
    if os.path.exists(DB_PATH):
        try:
            os.unlink(DB_PATH)
            print(f"Deleted database file: {DB_PATH}")
            return True
        except Exception as e:
            print(f"Error deleting database: {e}")
            return False
    else:
        print(f"Database file not found: {DB_PATH}")
        return False

def fix_migration_state():
    """Force Django to recognize that migrations have been applied."""
    print("\n===== Fixing Migration State =====")
    
    try:
        # Get cursor
        cursor = connection.cursor()
        
        # Check if django_migrations table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='django_migrations';")
        if not cursor.fetchone():
            print("django_migrations table does not exist. Creating...")
            cursor.execute("""
                CREATE TABLE django_migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    app VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    applied DATETIME NOT NULL
                );
            """)
        
        # Add migration entries for the api app
        cursor.execute("DELETE FROM django_migrations WHERE app='api';")
        cursor.execute("SELECT name FROM django_migrations WHERE app='api';")
        if not cursor.fetchall():
            print("Adding migration entries for api app...")
            
            # Get list of migration files
            migration_files = []
            if os.path.exists(MIGRATIONS_DIR):
                for file in os.listdir(MIGRATIONS_DIR):
                    if file.endswith('.py') and file != '__init__.py':
                        migration_name = file[:-3]  # Remove .py extension
                        migration_files.append(migration_name)
            
            # Add each migration to django_migrations table
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            for migration in migration_files:
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?);",
                    ('api', migration, now)
                )
            
            connection.commit()
            print(f"Added {len(migration_files)} migrations to django_migrations table")
        else:
            print("Migration entries for api app already exist")
        
        return True
    except Exception as e:
        print(f"Error fixing migration state: {e}")
        return False

def fix_migrations():
    """
    Comprehensive migration fix:
    1. Check current migration state
    2. Try to apply migrations
    3. If failed, fix migration state and try again
    """
    print("\n===== Fixing Migrations =====")
    
    # Check current migration state
    show_migrations()
    
    # Try to apply migrations
    print("\nAttempting to apply migrations...")
    try:
        result = subprocess.run(
            ["python", "manage.py", "migrate", "api"],
            capture_output=True, text=True
        )
        print(result.stdout)
        
        if result.returncode == 0:
            print("Migrations applied successfully!")
            return True
        else:
            print(f"Migration failed: {result.stderr}")
    except Exception as e:
        print(f"Error applying migrations: {e}")
    
    # If we got here, migrations failed. Try fixing the state.
    print("\nMigrations failed. Attempting to fix migration state...")
    if fix_migration_state():
        print("\nFixed migration state. Trying to apply migrations again...")
        try:
            result = subprocess.run(
                ["python", "manage.py", "migrate", "api"],
                capture_output=True, text=True
            )
            print(result.stdout)
            
            if result.returncode == 0:
                print("Migrations applied successfully after fixing state!")
                return True
            else:
                print(f"Migration still failed after fixing state: {result.stderr}")
        except Exception as e:
            print(f"Error applying migrations after fixing state: {e}")
    
    # Last resort - try making migrations first
    print("\nAttempting to make new migrations...")
    try:
        result = subprocess.run(
            ["python", "manage.py", "makemigrations", "api"],
            capture_output=True, text=True
        )
        print(result.stdout)
        
        if result.returncode == 0:
            print("Successfully made migrations. Trying to apply them...")
            result = subprocess.run(
                ["python", "manage.py", "migrate", "api"],
                capture_output=True, text=True
            )
            print(result.stdout)
            
            if result.returncode == 0:
                print("Migrations applied successfully after making new migrations!")
                return True
            else:
                print(f"Migration still failed after making new migrations: {result.stderr}")
        else:
            print(f"Failed to make migrations: {result.stderr}")
    except Exception as e:
        print(f"Error making/applying migrations: {e}")
    
    return False

def check_db():
    """Check database structure and tables."""
    print("\n===== Checking Database Structure =====")
    
    if not os.path.exists(DB_PATH):
        print(f"Database file not found: {DB_PATH}")
        return False
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        table_names = [table[0] for table in tables]
        print(f"Found {len(table_names)} tables:")
        for table in table_names:
            print(f"  - {table}")
        
        # Check critical tables
        critical_tables = [
            'django_migrations', 
            'api_chatmessage', 
            'api_user', 
            'auth_user'
        ]
        missing_tables = [table for table in critical_tables if table not in table_names]
        
        if missing_tables:
            print(f"\nWARNING: Missing critical tables: {', '.join(missing_tables)}")
        else:
            print("\nAll critical tables exist")
        
        # Check django_migrations table specifically
        if 'django_migrations' in table_names:
            cursor.execute("SELECT app, name FROM django_migrations ORDER BY app, name;")
            migrations = cursor.fetchall()
            print(f"\nFound {len(migrations)} migrations in database:")
            for app, name in migrations:
                print(f"  - {app}.{name}")
        
        conn.close()
        return len(missing_tables) == 0
    except Exception as e:
        print(f"Error checking database: {e}")
        return False

def fix_db():
    """Fix database issues."""
    print("\n===== Fixing Database Issues =====")
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"Database file not found: {DB_PATH}")
        print("Creating new database through migrations...")
        return fix_migrations()
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        fixed_something = False
        
        # Check if api_chatmessage table exists and fix UUID issues if needed
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='api_chatmessage'")
        if cursor.fetchone():
            print("Checking api_chatmessage table for UUID issues...")
            
            # Check if there's a uuid column
            cursor.execute("PRAGMA table_info(api_chatmessage)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            if 'uuid' in column_names:
                # Check if any UUIDs are null or invalid
                cursor.execute("SELECT id, uuid FROM api_chatmessage WHERE uuid IS NULL OR length(uuid) != 36")
                invalid_rows = cursor.fetchall()
                
                if invalid_rows:
                    print(f"Found {len(invalid_rows)} chat messages with invalid UUIDs. Fixing...")
                    for row_id, _ in invalid_rows:
                        new_uuid = str(uuid.uuid4())
                        cursor.execute("UPDATE api_chatmessage SET uuid = ? WHERE id = ?", (new_uuid, row_id))
                    
                    conn.commit()
                    print(f"Fixed {len(invalid_rows)} chat message UUIDs")
                    fixed_something = True
                else:
                    print("No invalid UUIDs found in api_chatmessage table")
        
        conn.close()
        
        # Try fixing migrations if needed
        if not fixed_something:
            print("No database-level issues found. Checking migrations...")
            return fix_migrations()
        
        return True
    except Exception as e:
        print(f"Error fixing database: {e}")
        return False

def reset_db():
    """Reset the database completely."""
    print("\n===== RESETTING DATABASE =====")
    print("WARNING: This will delete all data in the database!")
    print("Proceeding in 3 seconds...")
    import time
    time.sleep(3)
    
    cleaned = clean_db()
    if cleaned:
        cleaned_migrations = clean_migrations()
        print("\nNow creating new database...")
        return fix_migrations()
    return False

def show_help():
    """Show help text and available commands."""
    print(__doc__)

def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) < 2 or sys.argv[1] in ['-h', '--help', 'help']:
        show_help()
        sys.exit(0)
    
    command = sys.argv[1].lower()
    
    commands = {
        'clean_cache': clean_cache,
        'clean_migrations': clean_migrations,
        'fix_migrations': fix_migrations,
        'check_db': check_db,
        'fix_db': fix_db,
        'reset_db': reset_db,
    }
    
    if command == 'all':
        print("===== Running All Maintenance Operations =====")
        clean_cache()
        check_db()
        fix_db()
        print("\n===== All Maintenance Operations Completed =====")
    elif command in commands:
        commands[command]()
    else:
        print(f"Unknown command: {command}")
        show_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
