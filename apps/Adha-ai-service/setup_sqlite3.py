"""
Script to check SQLite3 installation and set it up if missing.
"""
import os
import sys
import subprocess
import platform
import urllib.request
import zipfile
import shutil
import ctypes
from pathlib import Path

def is_admin():
    """Check if the script is running with admin privileges on Windows."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        return False

def check_sqlite3_installed():
    """Check if SQLite3 is available on the system path."""
    try:
        subprocess.run(['sqlite3', '--version'], 
                      stdout=subprocess.PIPE, 
                      stderr=subprocess.PIPE, 
                      check=True)
        print("SQLite3 is already installed and available!")
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        print("SQLite3 command-line tool not found on your system path.")
        return False

def download_sqlite3_windows():
    """Download SQLite3 for Windows and add it to the project."""
    # Create a bin directory in our project
    bin_dir = Path(__file__).parent / 'bin'
    bin_dir.mkdir(exist_ok=True)
    
    sqlite_dir = bin_dir / 'sqlite3'
    sqlite_dir.mkdir(exist_ok=True)
    
    # Download SQLite3 from the official SQLite website
    sqlite_url = "https://www.sqlite.org/2023/sqlite-tools-win32-x86-3410200.zip"
    zip_path = bin_dir / "sqlite3.zip"
    
    print(f"Downloading SQLite3 from {sqlite_url}...")
    
    try:
        urllib.request.urlretrieve(sqlite_url, zip_path)
        
        # Extract the zip file
        print(f"Extracting SQLite3 to {sqlite_dir}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(sqlite_dir)
        
        # Find the sqlite3.exe in the extracted directories
        sqlite_exe = None
        for root, dirs, files in os.walk(sqlite_dir):
            for file in files:
                if file.lower() == 'sqlite3.exe':
                    sqlite_exe = os.path.join(root, file)
                    break
            if sqlite_exe:
                break
        
        if not sqlite_exe:
            print("Could not find sqlite3.exe in the downloaded package.")
            return False
        
        # Copy sqlite3.exe to the bin directory
        shutil.copy(sqlite_exe, bin_dir / 'sqlite3.exe')
        
        print("SQLite3 has been installed in the project bin directory.")
        
        # Clean up
        if zip_path.exists():
            os.remove(zip_path)
        
        return True
    
    except Exception as e:
        print(f"Error downloading or extracting SQLite3: {e}")
        return False

def add_to_path(directory):
    """Add directory to the PATH environment variable."""
    if directory not in os.environ['PATH'].split(os.pathsep):
        os.environ['PATH'] = f"{directory}{os.pathsep}{os.environ['PATH']}"
        print(f"Added {directory} to PATH environment variable.")

def main():
    if check_sqlite3_installed():
        return True
    
    print("\nSQLite3 is not available. Setting it up locally in the project...\n")
    
    if platform.system() == 'Windows':
        success = download_sqlite3_windows()
        if success:
            # Get the absolute path to our bin directory
            bin_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'bin'))
            add_to_path(bin_dir)
            return True
    else:
        # Linux/macOS instructions
        print("\nFor Linux/macOS, please install SQLite3 using your package manager:")
        print("  • Ubuntu/Debian: sudo apt-get install sqlite3")
        print("  • macOS: brew install sqlite3")
        print("\nAfter installation, restart your terminal and try again.\n")
    
    return False

if __name__ == "__main__":
    if main():
        print("\nSQLite3 setup complete! You can now use Django management commands.")
        # Test if sqlite3 is now available
        try:
            result = subprocess.run(['sqlite3', '--version'], 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE, 
                                  text=True)
            print(f"SQLite3 version: {result.stdout.strip()}")
        except:
            print("SQLite3 is still not available in the current environment.")
            print("Please restart your terminal/command prompt and try again.")
    else:
        print("\nFailed to set up SQLite3. Please install it manually.")
