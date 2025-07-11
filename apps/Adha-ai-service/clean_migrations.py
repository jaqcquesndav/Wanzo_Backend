import os
import shutil
import subprocess

def clean_migrations():
    """
    Deletes all migration files except __init__.py and recreates
    an empty __init__.py file if it doesn't exist.
    """
    migrations_dir = os.path.join('api', 'migrations')
    
    # Ensure migrations directory exists
    os.makedirs(migrations_dir, exist_ok=True)
    
    # Delete all files in migrations directory except __init__.py
    for filename in os.listdir(migrations_dir):
        file_path = os.path.join(migrations_dir, filename)
        if filename != '__init__.py' and os.path.isfile(file_path):
            os.unlink(file_path)
            print(f"Deleted {file_path}")
    
    # Create __init__.py if it doesn't exist
    init_path = os.path.join(migrations_dir, '__init__.py')
    if not os.path.exists(init_path):
        open(init_path, 'w').close()
        print(f"Created {init_path}")

def clean_db():
    """
    Removes the SQLite database file if it exists.
    """
    db_file = 'db.sqlite3'
    if os.path.exists(db_file):
        os.unlink(db_file)
        print(f"Deleted database: {db_file}")

def regenerate_migrations():
    """
    Regenerates migrations for the api app.
    """
    result = subprocess.run(['python', 'manage.py', 'makemigrations', 'api'], 
                           capture_output=True, text=True)
    
    print("Migration generation output:")
    print(result.stdout)
    
    if result.stderr:
        print("Errors:")
        print(result.stderr)

if __name__ == "__main__":
    print("Cleaning migrations...")
    clean_migrations()
    
    proceed = input("Would you also like to delete the database and start fresh? (y/n): ")
    if proceed.lower() == 'y':
        clean_db()
    
    proceed = input("Generate new initial migration? (y/n): ")
    if proceed.lower() == 'y':
        regenerate_migrations()
        print("\nNow run 'python manage.py migrate' to apply the migrations.")
    else:
        print("\nYou can now manually run 'python manage.py makemigrations api'")
        print("followed by 'python manage.py migrate' to recreate and apply migrations.")
