@echo off
REM Helper script to run Django commands with proper SQLite3 setup

REM First, run the SQLite3 setup script
python setup_sqlite3.py

REM Then execute the Django command
python manage.py %*

REM Check if the command failed
if %errorlevel% neq 0 (
    echo.
    echo There was a problem running the Django command.
    echo If you're seeing SQLite3 errors, make sure to restart your command prompt after the setup.
    echo.
)
