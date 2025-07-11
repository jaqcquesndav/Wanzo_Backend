@echo off
echo Creating new migrations...
python manage.py makemigrations api
echo.
echo Applying migrations...
python manage.py migrate
echo.
echo Done!
