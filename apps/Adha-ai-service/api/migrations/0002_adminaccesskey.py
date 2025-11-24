from django.db import migrations, models
import django.db.models.deletion
import uuid

def generate_default_key():
    """Generate a default UUID-based key for migration"""
    return str(uuid.uuid4())

class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdminAccessKey',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(default=generate_default_key, max_length=100, unique=True)),
                ('description', models.CharField(max_length=255)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_keys', to='auth.user')),
                ('used_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='used_access_key', to='auth.user')),
            ],
            options={
                'verbose_name': 'Admin Access Key',
                'verbose_name_plural': 'Admin Access Keys',
            },
        ),
    ]
