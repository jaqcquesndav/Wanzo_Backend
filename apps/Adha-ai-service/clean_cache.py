#!/usr/bin/env python
import os
import shutil

def clean_django_cache():
    """
    Clean Django's cache files to prevent import conflicts.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Delete .pyc files
    pyc_count = 0
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.pyc'):
                file_path = os.path.join(root, file)
                try:
                    os.unlink(file_path)
                    pyc_count += 1
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")
    
    # Delete __pycache__ directories
    pycache_count = 0
    for root, dirs, files in os.walk(base_dir):
        if '__pycache__' in dirs:
            pycache_path = os.path.join(root, '__pycache__')
            try:
                shutil.rmtree(pycache_path)
                pycache_count += 1
            except Exception as e:
                print(f"Error removing {pycache_path}: {e}")
    
    print(f"Removed {pyc_count} .pyc files and {pycache_count} __pycache__ directories")

if __name__ == '__main__':
    clean_django_cache()
