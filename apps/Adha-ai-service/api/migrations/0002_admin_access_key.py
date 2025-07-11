from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0001_initial'),
    ]

    operations = [
        # Only add the fields to UserProfile - skip creating the AdminAccessKey model
        # since it's already created by another migration
        migrations.AddField(
            model_name='userprofile',
            name='user_type',
            field=models.CharField(choices=[('regular', 'Regular User'), ('admin', 'System Administrator')], default='regular', max_length=10, verbose_name='User Type'),
        ),
        
        migrations.AddField(
            model_name='userprofile',
            name='admin_access_key',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Admin Access Key'),
        ),
        
        # Add index on user_type field
        migrations.AddIndex(
            model_name='userprofile',
            index=models.Index(fields=['user_type'], name='api_userpro_user_ty_e25dcc_idx'),
        ),
    ]
