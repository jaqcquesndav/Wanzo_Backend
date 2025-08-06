@echo off
echo ====================================================
echo Installation et démarrage du service portfolio-institution
echo Version de débogage avec logs détaillés
echo ====================================================

echo Configuration des variables d'environnement...
set NODE_ENV=development
set DEBUG=true
set NODE_OPTIONS=--trace-warnings
set OTEL_SDK_DISABLED=true
set NEST_DEBUG=true
set LOG_LEVEL=debug

echo 1. Installation des dépendances avec --legacy-peer-deps...
call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'installation des dépendances
    exit /b 1
)

echo 2. Construction du projet...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de la construction du projet
    exit /b 1
)

echo 3. Démarrage du service en mode débogage...
echo Les logs seront envoyés dans debug-output.log

call node --trace-warnings --unhandled-rejections=strict dist/apps/portfolio-institution-service/src/main.js > debug-output.log 2>&1

echo ====================================================
echo Fin du script - Vérifiez le fichier debug-output.log pour les logs
echo ====================================================
