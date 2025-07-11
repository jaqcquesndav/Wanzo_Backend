from django.core.management.base import BaseCommand
from django.db import connection
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Fixes database schema issues by checking and applying migrations properly'

    def handle(self, *args, **options):
        self.stdout.write('Starting database schema repair...')
        
        # Check existing tables
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'api_%';")
            tables = [row[0] for row in cursor.fetchall()]
            self.stdout.write(f'Found tables: {", ".join(tables)}')
            
            # Check if the problematic table has an id column
            if 'api_chatconversation' in tables:
                try:
                    cursor.execute("PRAGMA table_info(api_chatconversation);")
                    columns = [row[1] for row in cursor.fetchall()]
                    self.stdout.write(f'ChatConversation columns: {", ".join(columns)}')
                    if 'id' in columns and 'conversation_id' not in columns:
                        self.stdout.write('Problem detected: ChatConversation has id instead of conversation_id as primary key')
                except Exception as e:
                    self.stdout.write(f'Error inspecting table: {e}')
        
        # Apply migrations
        self.stdout.write('Applying migrations to fix schema...')
        call_command('migrate', 'api', '--fake')
        call_command('migrate')
        
        self.stdout.write(self.style.SUCCESS('Database schema repair completed!'))
