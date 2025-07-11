"""
Script to check available Django migrations
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
django.setup()

# Get the migration list
from django.db.migrations.loader import MigrationLoader
from django.db import connections

connection = connections['default']
loader = MigrationLoader(connection)
migrations = loader.disk_migrations

print("Available migrations:")
app_migrations = {}
for (app, name), migration in migrations.items():
    if app not in app_migrations:
        app_migrations[app] = []
    app_migrations[app].append(name)

for app, names in app_migrations.items():
    print(f"App: {app}")
    for name in sorted(names):
        print(f"  - {name}")

# Also print the migration graph
print("\nMigration graph:")
for node in loader.graph.nodes:
    print(f"  {node}")

# Check specifically for the API app
print("\nAPI App migrations path:")
api_migration_path = os.path.join(os.path.dirname(__file__), 'api', 'migrations')
if os.path.exists(api_migration_path):
    files = [f for f in os.listdir(api_migration_path) if f.endswith('.py') and not f.startswith('__')]
    for file in sorted(files):
        print(f"  - {file}")
else:
    print("  API migrations directory not found!")
