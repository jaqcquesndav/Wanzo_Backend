@echo off
ECHO Fixing migration issues...

REM First, fake the migration as completed
python manage.py migrate api 0002_add_token_quota_models --fake

REM Then mark the problematic migrations as applied
python manage.py migrate api 0003_migration_cleanup --fake
python manage.py migrate api 0003_add_company_context_to_chatconversation --fake
python manage.py migrate api 0008_merge_20250410_1641 --fake
python manage.py migrate api 0009_merge_20250410_1719 --fake
python manage.py migrate api 0010_fix_migration_dependencies --fake

REM Finally run migrate to make sure everything is consistent
python manage.py migrate

ECHO Migration repair completed!
pause
