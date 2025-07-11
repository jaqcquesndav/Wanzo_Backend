#!/usr/bin/env python
import os
import django
import sys

# Configurer l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'comptable_ia_api.settings')
django.setup()

from django.db import connection

def check_tables():
    """Vérifie si les tables nécessaires existent dans la base de données."""
    with connection.cursor() as cursor:
        # Afficher toutes les tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("Tables trouvées dans la base de données :")
        for table in tables:
            print(f"- {table[0]}")
        
        # Vérifier spécifiquement les tables dont nous avons besoin
        needed_tables = [
            "api_journalentry", 
            "api_chatconversation", 
            "api_chatmessage"
        ]
        
        missing_tables = []
        
        for table in needed_tables:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}';")
            if not cursor.fetchone():
                missing_tables.append(table)
        
        if missing_tables:
            print("\nTables manquantes :")
            for table in missing_tables:
                print(f"- {table}")
            print("\nPour créer les tables manquantes, exécutez :")
            print("python manage.py makemigrations")
            print("python manage.py migrate")
        else:
            print("\nToutes les tables nécessaires sont présentes.")

if __name__ == "__main__":
    try:
        check_tables()
    except Exception as e:
        print(f"Erreur lors de la vérification des tables : {e}")
        sys.exit(1)
