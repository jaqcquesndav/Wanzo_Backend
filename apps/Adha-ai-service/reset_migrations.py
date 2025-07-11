#!/usr/bin/env python
"""
Script to reset Django migrations when they're broken
"""
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
django.setup()

from django.db import connection

def reset_migrations():
    """
    Reset Django migration history by removing all migration records from django_migrations table.
    This should be done after deleting all migration files, before creating new initial migrations.
    """
    print("Resetting Django migration history...")
    
    with connection.cursor() as cursor:
        # Check if django_migrations table exists - SQLite compatible syntax
        cursor.execute("""
            SELECT name 
            FROM sqlite_master 
            WHERE type='table' AND name='django_migrations';
        """)
        table_exists = cursor.fetchone() is not None
        
        if table_exists:
            # Delete all rows from django_migrations table for 'api' app
            cursor.execute("DELETE FROM django_migrations WHERE app = 'api';")
            print("✓ Migration history for 'api' app has been reset.")
        else:
            print("! django_migrations table doesn't exist. Database might not be initialized.")

    print("\n1. All migration records have been cleared from database.")
    print("2. Next step: Run 'python manage.py makemigrations api' to create new initial migrations.")
    print("3. Then run 'python manage.py migrate' to apply them.")
    
    # Create an empty __init__.py file in the migrations folder if it doesn't exist
    migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api', 'migrations')
    os.makedirs(migrations_dir, exist_ok=True)
    
    init_file = os.path.join(migrations_dir, '__init__.py')
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            pass  # Create empty file
        print("✓ Created migrations/__init__.py file.")
        
    # Optionally, create a clean start by removing other migration files
    migration_files = [f for f in os.listdir(migrations_dir) if f.endswith('.py') and f != '__init__.py']
    if migration_files:
        print(f"\nFound {len(migration_files)} existing migration files:")
        for file in migration_files:
            print(f"  - {file}")
        
        if input("\nDo you want to remove these files? (y/n): ").lower() == 'y':
            for file in migration_files:
                os.remove(os.path.join(migrations_dir, file))
            print(f"✓ Removed {len(migration_files)} migration files.")
        else:
            print("No files were removed.")

if __name__ == "__main__":
    reset_migrations()
    sys.exit(0)
