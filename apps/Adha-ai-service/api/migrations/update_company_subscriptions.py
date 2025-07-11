from django.db import migrations

def activate_subscriptions_and_set_tokens(apps, schema_editor):
    """
    Activate subscriptions for all existing companies and set token quota.
    """
    Company = apps.get_model('api', 'Company')
    
    # Update all existing companies
    companies = Company.objects.all()
    for company in companies:
        company.is_subscription_active = True
        company.token_quota = 1000000  # Set to 1 million tokens
        company.monthly_token_allowance = 1000000
        company.save()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Update this to your latest migration
    ]

    operations = [
        migrations.RunPython(activate_subscriptions_and_set_tokens),
    ]
