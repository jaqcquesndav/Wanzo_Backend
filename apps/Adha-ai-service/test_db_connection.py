"""
Script to test the PostgreSQL connection using Python's psycopg2 library.
This script will:
1. Load environment variables from .env
2. Attempt to connect to PostgreSQL using those variables
3. Print success or error message
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def test_db_connection():
    # Get database connection details from environment variables
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_DATABASE', 'adha-ai-service')
    db_user = os.environ.get('DB_USERNAME', 'postgres')
    db_password = os.environ.get('DB_PASSWORD', 'd2487a19465f468aa0bdfb7e04c35579')

    print("Trying to connect with:")
    print(f"  Database: {db_name}")
    print(f"  User: {db_user}")
    print(f"  Host: {db_host}")
    print(f"  Port: {db_port}")

    try:
        # Attempt to connect
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        
        # If connection is successful, print success message
        print("✅ Successfully connected to PostgreSQL!")
        
        # Close the connection
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    test_db_connection()
