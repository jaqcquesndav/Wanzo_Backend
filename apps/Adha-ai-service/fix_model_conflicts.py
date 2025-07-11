#!/usr/bin/env python
import os
import shutil
import re
import sys
import importlib
from datetime import datetime
import subprocess

def clean_cache():
    """Clean Python cache files"""
    print("Cleaning Python cache files...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Delete .pyc files and __pycache__ directories
    pyc_count = pycache_count = 0
    for root, dirs, files in os.walk(base_dir):
        # Remove __pycache__ directories
        if '__pycache__' in dirs:
            pycache_path = os.path.join(root, '__pycache__')
            try:
                shutil.rmtree(pycache_path)
                pycache_count += 1
                print(f"Removed: {pycache_path}")
            except Exception as e:
                print(f"Error removing {pycache_path}: {e}")
            dirs.remove('__pycache__')  # Don't recurse into deleted directories
            
        # Remove .pyc files
        for file in files:
            if file.endswith('.pyc'):
                file_path = os.path.join(root, file)
                try:
                    os.unlink(file_path)
                    pyc_count += 1
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")
    
    print(f"Removed {pyc_count} .pyc files and {pycache_count} __pycache__ directories")

def fix_models_py():
    """Fix the models.py file to only import from models/ directory"""
    print("Fixing models.py...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    main_models_py = os.path.join(base_dir, 'api', 'models.py')
    
    # Check if models.py exists
    if not os.path.exists(main_models_py):
        print(f"No models.py found at {main_models_py}")
        return False
    
    # Create backup of models.py
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{main_models_py}.{timestamp}.bak"
    shutil.copy2(main_models_py, backup_path)
    print(f"Created backup of models.py at {backup_path}")
    
    # Create new content with only imports
    new_content = """\"\"\"
API Models
----------
This file imports models from the models/ package.
Models should be defined in individual files in the models/ directory.
\"\"\"
from django.db import models

# Import models from the models package
from api.models.journal_entry import JournalEntry
from api.models.chat_conversation import ChatConversation
from api.models.chat_message import ChatMessage
from api.models.user_profile import UserProfile
from api.models.token_quota import TokenQuota

# Export models
__all__ = [
    'JournalEntry',
    'ChatConversation',
    'ChatMessage',
    'UserProfile',
    'TokenQuota'
]
"""
    
    # Write new content
    with open(main_models_py, 'w') as f:
        f.write(new_content)
    
    print(f"Updated {main_models_py}")
    return True

def fix_models_init():
    """Fix the models/__init__.py file"""
    print("Fixing models/__init__.py...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    init_file = os.path.join(base_dir, 'api', 'models', '__init__.py')
    
    if not os.path.exists(init_file):
        print(f"No __init__.py found at {init_file}")
        return False
    
    new_init_content = """\"\"\"
Models package initialization
----------------------------
This file imports models from individual files and makes them available at the package level.
\"\"\"

# Import models from individual files
from .journal_entry import JournalEntry
from .chat_conversation import ChatConversation
from .chat_message import ChatMessage
from .user_profile import UserProfile
from .token_quota import TokenQuota

# Export models
__all__ = [
    'JournalEntry',
    'ChatConversation',
    'ChatMessage',
    'UserProfile',
    'TokenQuota'
]
"""
    
    # Write new content
    with open(init_file, 'w') as f:
        f.write(new_init_content)
    
    print(f"Updated {init_file}")
    return True

def clear_sys_modules():
    """Clear api.models from sys.modules cache"""
    print("Clearing sys.modules cache...")
    to_remove = []
    for name in sys.modules:
        if name.startswith('api.models') or name == 'api.models':
            to_remove.append(name)
    
    for name in to_remove:
        if name in sys.modules:
            del sys.modules[name]
            print(f"Removed {name} from sys.modules")

def check_imports():
    """Try importing models to verify changes"""
    print("Testing imports...")
    try:
        clear_sys_modules()
        from api.models import JournalEntry, ChatConversation, ChatMessage
        print("✅ Successfully imported JournalEntry, ChatConversation, ChatMessage")
        return True
    except Exception as e:
        print(f"❌ Error importing models: {e}")
        return False

def run_django_check():
    """Run Django's check command to validate models"""
    print("\nRunning Django's check command...")
    try:
        result = subprocess.run([sys.executable, 'manage.py', 'check', '--no-color'], 
                              capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"ERRORS:\n{result.stderr}")
        return result.returncode == 0
    except Exception as e:
        print(f"Error running Django check: {e}")
        return False

if __name__ == '__main__':
    print("=== Starting Comprehensive Model Conflict Fix ===")
    
    # 1. Clean cache files
    clean_cache()
    
    # 2. Fix models.py
    fix_models_py()
    
    # 3. Fix models/__init__.py
    fix_models_init()
    
    # 4. Clear sys.modules cache
    clear_sys_modules()
    
    print("\n=== Fix completed ===")
    print("\nNext steps:")
    print("1. Try running Django: python manage.py runserver")
    print("2. If issues persist, please check the logs above for errors")
