#!/usr/bin/env python
"""
Script to check for duplicate model definitions and other issues.
Run this script directly to find conflicts before running Django commands.
"""
import os
import sys
import importlib
from collections import defaultdict

def check_models():
    """
    Check for duplicate model definitions in the project.
    """
    print("Checking for duplicate model definitions...")
    
    # Add the project root to the Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # Track models by name
    models_by_name = defaultdict(list)
    model_paths = []
    
    # Look for model files in the project
    for root, dirs, files in os.walk(os.path.dirname(os.path.abspath(__file__))):
        for filename in files:
            if filename.endswith('.py') and not filename.startswith('_'):
                filepath = os.path.join(root, filename)
                module_path = filepath.replace(os.path.dirname(os.path.abspath(__file__)) + os.sep, '')
                module_path = module_path.replace(os.sep, '.').replace('.py', '')
                
                if 'models' in module_path:
                    model_paths.append((filepath, module_path))
    
    # Check each model file
    for filepath, module_path in model_paths:
        try:
            spec = importlib.util.find_spec(module_path)
            if spec:
                # Load module in isolation mode to avoid Django app registry issues
                print(f"Checking module: {module_path}")
                
                # Read the file content directly to find class definitions
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Look for model class definitions
                import re
                model_classes = re.findall(r'class\s+(\w+)\s*\(\s*models\.Model', content)
                
                for model_name in model_classes:
                    models_by_name[model_name].append(filepath)
            
        except Exception as e:
            print(f"Error checking {module_path}: {e}")
    
    # Report duplicate models
    duplicates_found = False
    for model_name, paths in models_by_name.items():
        if len(paths) > 1:
            duplicates_found = True
            print(f"\nDuplicate model '{model_name}' found in:")
            for path in paths:
                print(f"  - {path}")
    
    if not duplicates_found:
        print("\nNo duplicate models found!")
    else:
        print("\nDuplicate models found. Please fix these issues before running Django commands.")

if __name__ == "__main__":
    check_models()
