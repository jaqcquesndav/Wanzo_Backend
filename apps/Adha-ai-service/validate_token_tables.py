#!/usr/bin/env python
import os
import sys
import sqlite3
import django
from datetime import datetime

# Set up Django environment
def setup_django():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
    django.setup()

def validate_and_fix_token_tables():
    """
    Validate token tracking tables and fix common issues.
    """
    setup_django()
    
    from django.conf import settings
    from django.db import connection
    
    print("Validating token tracking database tables...")
    
    # Dictionary of tables and their expected columns
    expected_schema = {
        'api_tokenquota': {
            'columns': [
                ('id', 'INTEGER PRIMARY KEY'),
                ('user_id', 'INTEGER UNIQUE'),
                ('monthly_quota', 'INTEGER'),
                ('remaining_quota', 'INTEGER'),
                ('reset_date', 'DATETIME'),
                ('last_updated', 'DATETIME'),
                ('total_tokens_used', 'BIGINT'),
                ('plan_type', 'VARCHAR(20)'),
                ('additional_settings', 'JSON')
            ]
        },
        'api_tokenusage': {
            'columns': [
                ('message_id', 'TEXT PRIMARY KEY'),
                ('user_id', 'INTEGER'),
                ('operation_type', 'VARCHAR(50)'),
                ('model', 'VARCHAR(50)'),
                ('input_tokens', 'INTEGER'),
                ('output_tokens', 'INTEGER'),
                ('total_tokens', 'INTEGER'),
                ('operation_id', 'VARCHAR(100)'),
                ('timestamp', 'DATETIME'),
                ('metadata', 'JSON')
            ]
        }
    }
    
    # Use raw SQL to validate and fix the tables
    with connection.cursor() as cursor:
        for table, schema in expected_schema.items():
            print(f"\nChecking {table}...")
            
            # Check if table exists
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if not cursor.fetchone():
                print(f"Table {table} does not exist. Creating table...")
                
                # Create table with expected schema
                columns_sql = ', '.join([f"{name} {type}" for name, type in schema['columns']])
                cursor.execute(f"CREATE TABLE {table} ({columns_sql})")
                print(f"Created table {table}")
                continue
            
            # Get existing columns
            cursor.execute(f"PRAGMA table_info({table})")
            existing_columns = {row[1]: row[2] for row in cursor.fetchall()}
            
            # Check for missing columns
            missing_columns = []
            for name, type in schema['columns']:
                if name not in existing_columns:
                    missing_columns.append((name, type))
            
            # Add missing columns
            for name, type in missing_columns:
                print(f"Adding missing column {name} to {table}")
                try:
                    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {name} {type}")
                    print(f"Added {name} column")
                except Exception as e:
                    print(f"Error adding column {name}: {e}")
                    
            # Report validation status
            if not missing_columns:
                print(f"✅ {table} has all required columns")
            else:
                print(f"✅ {table} has been updated with missing columns")
    
    print("\nDatabase validation and fixes completed.")

if __name__ == "__main__":
    validate_and_fix_token_tables()
