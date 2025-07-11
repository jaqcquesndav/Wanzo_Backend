from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Update this to match your latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='tokenusage',
            name='prompt_tokens',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='tokenusage',
            name='completion_tokens',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='tokenusage',
            name='total_tokens',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='tokenusage',
            name='request_type',
            field=models.CharField(default='chat', max_length=50),
        ),
    ]
