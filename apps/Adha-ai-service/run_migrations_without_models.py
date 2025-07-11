#!/usr/bin/env python
import os
import sys
import subprocess

# Define the environment variable to bypass model loading
os.environ['DJANGO_SKIP_MODEL_VALIDATION'] = 'True'

# Define the command to run
cmd = [sys.executable, 'manage.py', 'migrate', '--fake']

# Run the management command with the environment variable set
try:
    print("Running migrations with model validation disabled...")
    result = subprocess.run(cmd, env=os.environ)
    print(f"Command exited with code {result.returncode}")
except Exception as e:
    print(f"Error executing command: {e}")

# Instructions for next steps
print("\nIf the migration completed successfully, try running the server normally.")
print("If problems persist, consider running this command:")
print("python fix_chat_tables.py")
