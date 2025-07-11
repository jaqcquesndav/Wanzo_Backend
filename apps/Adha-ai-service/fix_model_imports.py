#!/usr/bin/env python
import os
import re
import shutil
from datetime import datetime

def fix_model_imports():
    """
    Fix model import conflicts by ensuring models are only defined in one place.
    This script:
    1. Backs up models.py
    2. Removes model definitions from models.py
    3. Updates models.py to only import models from the models/ directory
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, 'api', 'models')
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
    
    # Read current content
    with open(main_models_py, 'r') as f:
        content = f.read()
    
    # Look for model definitions
    model_pattern = r'class\s+([A-Za-z0-9_]+)\s*\(\s*models\.Model[^)]*\):'
    model_defs = re.findall(model_pattern, content)
    
    if model_defs:
        print(f"Found {len(model_defs)} model definitions in models.py:")
        for model in model_defs:
            print(f"  - {model}")
        
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
        
        print(f"Updated {main_models_py} to only import models from the models/ package")
    else:
        print(f"No model definitions found in {main_models_py}")
    
    # Check and fix models/__init__.py
    init_file = os.path.join(models_dir, '__init__.py')
    if os.path.exists(init_file):
        with open(init_file, 'r') as f:
            init_content = f.read()
        
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
        
        print(f"Updated {init_file} with clean imports")
    
    print("\nModel imports have been fixed. Next steps:")
    print("1. Run `python check_model_structure.py` to verify the changes")
    print("2. Clear Python cache: `python -c \"import pathlib; [p.unlink() for p in pathlib.Path('.').rglob('*.pyc')]\"")
    print("3. Try running Django: `python manage.py runserver`")
    
    return True

if __name__ == '__main__':
    fix_model_imports()
