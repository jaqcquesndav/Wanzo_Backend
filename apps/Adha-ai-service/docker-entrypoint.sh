#!/bin/bash
set -e

# Définir les variables d'environnement par défaut si elles ne sont pas présentes
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-"adha_ai_service.settings"}
export PYTHONPATH=${PYTHONPATH:-"/app"}
export DATABASE_URL=${DATABASE_URL:-"postgres://postgres:d2487a19465f468aa0bdfb7e04c35579@postgres:5432/adha_ai_db"}

# Attendre que la base de données soit disponible
echo "Attente de la base de données PostgreSQL..."
until pg_isready -h postgres -U postgres; do
  echo "Base de données indisponible - attente..."
  sleep 2
done
echo "Base de données disponible!"

# Attendre que Kafka soit disponible (avec timeout)
echo "Vérification de la disponibilité de Kafka..."
KAFKA_HOST=${KAFKA_BROKER_INTERNAL:-kafka:29092}
KAFKA_WAIT_TIME=0
KAFKA_MAX_WAIT=30

while [ $KAFKA_WAIT_TIME -lt $KAFKA_MAX_WAIT ]; do
  if nc -z ${KAFKA_HOST%:*} ${KAFKA_HOST#*:} 2>/dev/null; then
    echo "Kafka est disponible!"
    break
  fi
  echo "Kafka indisponible - attente... ($KAFKA_WAIT_TIME/$KAFKA_MAX_WAIT secondes)"
  sleep 2
  KAFKA_WAIT_TIME=$((KAFKA_WAIT_TIME + 2))
done

if [ $KAFKA_WAIT_TIME -ge $KAFKA_MAX_WAIT ]; then
  echo "⚠️  ATTENTION: Kafka n'est pas disponible après ${KAFKA_MAX_WAIT}s"
  echo "⚠️  Le service démarrera en mode dégradé (sans Kafka)"
else
  echo "✓ Kafka est prêt"
fi

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
  exec gunicorn adha_ai_service.wsgi:application --bind 0.0.0.0:8002 --workers 4 --timeout 120 --access-logfile - --error-logfile -
else
  echo "Exécution de la commande: $@"
  exec "$@"
fi