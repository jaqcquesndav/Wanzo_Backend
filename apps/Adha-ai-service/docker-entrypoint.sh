#!/bin/bash
set -e

# Définir les variables d'environnement par défaut si elles ne sont pas présentes
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-"config.settings.production"}
export PYTHONPATH=${PYTHONPATH:-"/app"}
export DATABASE_URL=${DATABASE_URL:-"postgres://postgres:d2487a19465f468aa0bdfb7e04c35579@postgres:5432/adha_ai_db"}

# Attendre que la base de données soit disponible
echo "Attente de la base de données PostgreSQL..."
until pg_isready -h postgres -U postgres; do
  echo "Base de données indisponible - attente..."
  sleep 2
done
echo "Base de données disponible!"

# Appliquer les migrations Django
echo "Application des migrations..."
python manage.py migrate --noinput

# Collecter les fichiers statiques
echo "Collection des fichiers statiques..."
python manage.py collectstatic --noinput

# Créer un superuser si nécessaire
if [ "$CREATE_SUPERUSER" = "true" ]; then
  echo "Création du superuser admin..."
  python manage.py createsuperuser --noinput || true
fi

# Exécuter la commande passée au conteneur
if [ "$1" = "" ]; then
  echo "Démarrage du serveur Django..."
  exec gunicorn config.wsgi:application --bind 0.0.0.0:8002 --workers 4 --timeout 120 --access-logfile - --error-logfile -
else
  echo "Exécution de la commande: $@"
  exec "$@"
fi

