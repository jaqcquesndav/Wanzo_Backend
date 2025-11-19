# Celery Configuration for Adha AI Service
import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adha_ai_service.settings')

# Create Celery app
app = Celery('adha_ai_service')

# Load config from Django settings with CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered apps
app.autodiscover_tasks()

# Periodic tasks configuration
app.conf.beat_schedule = {
    'process-pending-retries-every-5-minutes': {
        'task': 'api.tasks.retry_tasks.process_pending_retries',
        'schedule': 300.0,  # 5 minutes
    },
    'cleanup-old-data-daily': {
        'task': 'api.tasks.retry_tasks.cleanup_old_data_task',
        'schedule': crontab(hour=2, minute=0),  # 2:00 AM every day
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
