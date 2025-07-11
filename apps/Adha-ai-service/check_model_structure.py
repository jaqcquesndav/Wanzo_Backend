#!/usr/bin/env python
import os
import sys
import re

def check_model_structure():
    """Check that the model structure is correct and all necessary files exist."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, 'api', 'models')
    main_models_py = os.path.join(base_dir, 'api', 'models.py')
    
    # Check that the models directory exists
    if not os.path.isdir(models_dir):
        print(f"ERROR: Models directory not found at {models_dir}")
        return False
    
    # Check for required model files
    required_model_files = [
        'journal_entry.py',
        'chat_conversation.py',
        'chat_message.py',
        'user_profile.py',
        'token_quota.py',
        '__init__.py'
    ]
    
    missing_files = []
    for model_file in required_model_files:
        if not os.path.isfile(os.path.join(models_dir, model_file)):
            missing_files.append(model_file)
    
    if missing_files:
        print(f"ERROR: Missing required model files: {', '.join(missing_files)}")
        print(f"These files should be located in {models_dir}")
        return False
    
    # Check that __init__.py properly imports all models
    init_file = os.path.join(models_dir, '__init__.py')
    with open(init_file, 'r') as f:
        content = f.read()
        
    required_imports = [
        'from .journal_entry import JournalEntry',
        'from .chat_conversation import ChatConversation',
        'from .chat_message import ChatMessage',
        'from .user_profile import UserProfile',
        'from .token_quota import TokenQuota',
    ]
    
    missing_imports = []
    for required_import in required_imports:
        if required_import not in content:
            missing_imports.append(required_import)
    
    if missing_imports:
        print(f"ERROR: Missing required imports in {init_file}:")
        for missing_import in missing_imports:
            print(f"  {missing_import}")
        return False
    
    # CRITICAL: Check if models.py contains competing model definitions
    if os.path.exists(main_models_py):
        with open(main_models_py, 'r') as f:
            main_models_content = f.read()
        
        # Look for model definitions in models.py
        model_pattern = r'class\s+([A-Za-z0-9_]+)\s*\(\s*models\.Model'
        model_defs = re.findall(model_pattern, main_models_content)
        
        if model_defs:
            print(f"CRITICAL ERROR: Found model definitions in {main_models_py}")
            print("These models will conflict with models defined in the models/ directory:")
            for model in model_defs:
                print(f"  - {model}")
            print("\nYou must remove these model definitions from models.py and only import them from the models/ directory.")
            return False
    
    print("Model structure check passed!")
    return True

if __name__ == '__main__':
    if check_model_structure():
        sys.exit(0)
    else:
        sys.exit(1)
