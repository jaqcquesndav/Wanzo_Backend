#!/usr/bin/env python

import importlib
import os
import sys

def check_import(module_path, class_name):
    """
    Check if a specific class can be imported from a module
    """
    try:
        module = importlib.import_module(module_path)
        if hasattr(module, class_name):
            print(f"✅ Successfully imported {class_name} from {module_path}")
            return True
        else:
            print(f"❌ Module {module_path} does not expose {class_name}")
            print(f"   Available attributes: {dir(module)}")
            return False
    except ImportError as e:
        print(f"❌ Failed to import {module_path}: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error importing {module_path}: {e}")
        return False

def clear_import_cache(module_prefix):
    """
    Clear cached imports for modules starting with the given prefix
    """
    to_remove = [m for m in sys.modules if m.startswith(module_prefix)]
    for m in to_remove:
        del sys.modules[m]
    print(f"Cleared {len(to_remove)} cached imports for prefix '{module_prefix}'")

def main():
    print("Checking critical imports...")
    
    # Clear any cached imports that might affect our tests
    clear_import_cache('api.')
    
    # Check the direct import of TokenUsage from token_quota.py
    check_import('api.models.token_quota', 'TokenUsage')
    
    # Check if the model is exported from the models package
    check_import('api.models', 'TokenUsage')
    
    # Check if TokenTracker can import TokenUsage
    try:
        from api.services.token_tracker import TokenTracker
        print(f"✅ Successfully imported TokenTracker from api.services.token_tracker")
    except ImportError as e:
        print(f"❌ Failed to import TokenTracker: {e}")
    
    # Try the full import chain
    try:
        from agents.utils.token_manager import get_token_counter
        print(f"✅ Successfully imported get_token_counter from agents.utils.token_manager")
    except ImportError as e:
        print(f"❌ Failed to import get_token_counter: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
