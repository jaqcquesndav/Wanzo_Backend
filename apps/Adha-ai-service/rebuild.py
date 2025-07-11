#!/usr/bin/env python
"""
Utility script to clear cached .pyc files and perform other cleanup tasks.
This helps resolve model conflicts and other import-related issues.
"""
import os
import sys
import shutil
import tempfile

def clean_pyc_files():
    """Remove all .pyc files and __pycache__ directories."""
    print("Cleaning .pyc files and __pycache__ directories...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    count = 0
    
    for root, dirs, files in os.walk(base_dir):
        # Remove __pycache__ directories
        if '__pycache__' in dirs:
            pycache_dir = os.path.join(root, '__pycache__')
            print(f"Removing {pycache_dir}")
            shutil.rmtree(pycache_dir, ignore_errors=True)
            dirs.remove('__pycache__')
            count += 1
        
        # Remove .pyc files
        for file in files:
            if file.endswith('.pyc'):
                pyc_file = os.path.join(root, file)
                print(f"Removing {pyc_file}")
                os.remove(pyc_file)
                count += 1
    
    print(f"Cleaned {count} items.")

def check_model_structure():
    """Check if the model structure is correct."""
    print("Checking model structure...")
    
    # Check for duplicate model definitions
    potential_conflicts = []
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Check both models.py and models directory
    models_py = os.path.join(base_dir, 'api', 'models.py')
    models_dir = os.path.join(base_dir, 'api', 'models')
    
    if os.path.exists(models_py) and os.path.isdir(models_dir):
        print("WARNING: Both models.py and models/ directory exist. This can cause conflicts.")
        
        with open(models_py, 'r') as f:
            content = f.read()
            if 'class' in content and 'models.Model' in content:
                print("CRITICAL: models.py contains model definitions, not just imports!")
                print("This will cause conflicts with models defined in the models/ directory.")
                potential_conflicts.append(models_py)
    
    if potential_conflicts:
        print("\nPotential model conflicts detected in the following files:")
        for file in potential_conflicts:
            print(f"- {file}")
        
        print("\nFix these conflicts by ensuring models are defined in only one place.")
    else:
        print("No obvious model conflicts detected.")

if __name__ == '__main__':
    clean_pyc_files()
    check_model_structure()
    
    print("\nFinished cleaning. Try running the server again.")
    print("python manage.py runserver")
