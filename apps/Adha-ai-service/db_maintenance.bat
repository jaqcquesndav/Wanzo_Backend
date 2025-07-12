@echo off
REM =========================================================================
REM Django Database Maintenance Utility Wrapper
REM =========================================================================
REM This batch script provides a simple interface to the db_maintenance.py
REM Python utility for managing the Django database.
REM
REM Usage:
REM   db_maintenance.bat [command]
REM 
REM Commands:
REM   clean_cache      - Remove Python cache files and directories
REM   clean_migrations - Remove migration files (except __init__.py)
REM   fix_migrations   - Fix migration state issues
REM   check_db         - Check database structure and tables
REM   fix_db           - Fix database issues (migrations, tables, etc.)
REM   reset_db         - Reset the database completely (CAUTION: data loss)
REM   all              - Run all maintenance operations in sequence
REM   help             - Show this help message
REM
REM Examples:
REM   db_maintenance.bat clean_cache
REM   db_maintenance.bat fix_migrations
REM =========================================================================

REM Display help if no parameters or help requested
IF "%~1"=="" GOTO :HELP
IF /I "%~1"=="help" GOTO :HELP
IF /I "%~1"=="-h" GOTO :HELP
IF /I "%~1"=="--help" GOTO :HELP

REM Execute Python script with the provided command
python db_maintenance.py %*
GOTO :END

:HELP
python db_maintenance.py --help

:END
