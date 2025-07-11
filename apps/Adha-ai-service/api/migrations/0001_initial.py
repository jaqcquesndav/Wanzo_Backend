from django.db import migrations, models
from django.utils import timezone
from django.conf import settings

class Migration(migrations.Migration):

    initial = True
    
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Create Company model
        migrations.CreateModel(
            name='Company',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('registration_number', models.CharField(blank=True, max_length=50)),
                ('vat_number', models.CharField(blank=True, max_length=30)),
                ('address', models.TextField(blank=True)),
                ('city', models.CharField(blank=True, max_length=50)),
                ('postal_code', models.CharField(blank=True, max_length=20)),
                ('country', models.CharField(blank=True, max_length=50)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('website', models.URLField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='company_logos/')),
                ('fiscal_year_start', models.DateField(blank=True, null=True)),
                ('fiscal_year_end', models.DateField(blank=True, null=True)),
                ('chart_of_accounts', models.JSONField(blank=True, default=dict)),
                ('industry', models.CharField(blank=True, max_length=100)),
                ('isolation_remaining', models.IntegerField(default=0, help_text='Nombre de jours restants d\'isolation des données')),
                ('has_subscription', models.BooleanField(default=False, help_text="Si l'entreprise a un abonnement actif")),
                ('subscription_end_date', models.DateField(blank=True, null=True)),
                ('total_tokens_purchased', models.BigIntegerField(default=0, help_text="Nombre total de tokens achetés")),
                ('tokens_consumed', models.BigIntegerField(default=0, help_text="Nombre de tokens consommés")),
                ('last_token_reset', models.DateField(default=timezone.now, help_text="Date de la dernière réinitialisation mensuelle")),
                ('owner', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='owned_companies', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Company',
                'verbose_name_plural': 'Companies',
            },
        ),
        
        # Create TokenPrice model
        migrations.CreateModel(
            name='TokenPrice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('model_name', models.CharField(max_length=100, unique=True)),
                ('price_per_million', models.DecimalField(decimal_places=2, default=10.0, max_digits=10)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Token Price',
                'verbose_name_plural': 'Token Prices',
            },
        ),
        
        # Add ManyToMany relationship for Company.employees
        migrations.AddField(
            model_name='company',
            name='employees',
            field=models.ManyToManyField(blank=True, related_name='companies', to=settings.AUTH_USER_MODEL),
        ),
        
        # Create TokenQuota model
        migrations.CreateModel(
            name='TokenQuota',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('max_tokens', models.IntegerField(default=1000000)),
                ('tokens_used', models.IntegerField(default=0)),
                ('reset_period', models.CharField(choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('none', 'No reset')], default='monthly', max_length=20)),
                ('last_reset', models.DateTimeField(auto_now_add=True)),
                ('next_reset', models.DateTimeField(blank=True, null=True)),
                ('user', models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='token_quota', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        
        # Create TokenUsage model
        migrations.CreateModel(
            name='TokenUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('operation_id', models.CharField(blank=True, max_length=100, null=True)),
                ('operation_type', models.CharField(max_length=50)),
                ('model_name', models.CharField(max_length=50)),
                ('input_tokens', models.IntegerField(default=0)),
                ('output_tokens', models.IntegerField(default=0)),
                ('endpoint', models.CharField(blank=True, max_length=255, null=True)),
                ('user', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='token_usages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        
        # Create JournalEntry model
        migrations.CreateModel(
            name='JournalEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(verbose_name='Date')),
                ('piece_reference', models.CharField(blank=True, max_length=50, verbose_name='Piece Reference')),
                ('description', models.CharField(max_length=255, verbose_name='Description')),
                ('debit_data', models.JSONField(default=list, verbose_name='Debit Entries')),
                ('credit_data', models.JSONField(default=list, verbose_name='Credit Entries')),
                ('journal', models.CharField(default='JO', max_length=10, verbose_name='Journal')),
                ('source_data', models.JSONField(blank=True, default=dict, verbose_name='Source Data')),
                ('source_type', models.CharField(choices=[('manual', 'Manual Entry'), ('document', 'Document'), ('prompt', 'Natural Language Prompt'), ('import', 'Data Import')], default='manual', max_length=20, verbose_name='Source Type')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                ('is_verified', models.BooleanField(default=False, verbose_name='Is Verified')),
                ('verification_notes', models.TextField(blank=True, verbose_name='Verification Notes')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='journal_entries', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Journal Entry',
                'verbose_name_plural': 'Journal Entries',
                'ordering': ['-date', '-created_at'],
            },
        ),
        
        # Create TokenPurchaseRequest model
        migrations.CreateModel(
            name='TokenPurchaseRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request_date', models.DateTimeField(auto_now_add=True)),
                ('approval_date', models.DateTimeField(blank=True, null=True)),
                ('tokens_requested', models.BigIntegerField(help_text='Nombre de tokens demandés')),
                ('price_per_million', models.DecimalField(decimal_places=2, max_digits=10)),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('status', models.CharField(choices=[('pending', 'En attente'), ('approved', 'Approuvé'), ('rejected', 'Rejeté'), ('cancelled', 'Annulé')], default='pending', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('approved_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='approved_tokens', to=settings.AUTH_USER_MODEL)),
                ('company', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='token_purchases', to='api.company')),
                ('requested_by', models.ForeignKey(null=True, on_delete=models.deletion.SET_NULL, related_name='token_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Token Purchase Request',
                'verbose_name_plural': 'Token Purchase Requests',
            },
        ),
    ]
