"""
Django management command pour réinitialiser les quotas mensuels de tokens.
À exécuter via cron job le 1er de chaque mois: 0 0 1 * *
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Company

class Command(BaseCommand):
    help = 'Réinitialise les quotas mensuels de tokens pour les companies avec abonnement actif'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche ce qui serait fait sans effectuer les modifications',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force la réinitialisation même si déjà fait ce mois-ci',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        self.stdout.write(self.style.NOTICE(
            f"🔄 Starting monthly token reset (dry_run={dry_run}, force={force})..."
        ))
        
        # Récupérer toutes les companies avec abonnement actif
        companies = Company.objects.filter(is_subscription_active=True)
        
        total_companies = companies.count()
        reset_count = 0
        skip_count = 0
        error_count = 0
        
        self.stdout.write(f"Found {total_companies} companies with active subscription")
        
        for company in companies:
            try:
                # Vérifier si déjà réinitialisé ce mois (sauf si force)
                today = timezone.now().date()
                if not force:
                    if (company.last_token_reset.year == today.year and 
                        company.last_token_reset.month == today.month):
                        self.stdout.write(
                            f"  ⏭️  Skipping {company.name} (already reset this month)"
                        )
                        skip_count += 1
                        continue
                
                # Calculer les tokens à ajouter
                monthly_allowance = company.monthly_token_allowance or 1000000
                
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  [DRY RUN] Would add {monthly_allowance:,} tokens to {company.name}"
                        )
                    )
                    reset_count += 1
                else:
                    # Effectuer la réinitialisation
                    old_quota = company.token_quota
                    company.total_tokens_purchased += monthly_allowance
                    company.token_quota += monthly_allowance
                    company.last_token_reset = today
                    company.save(update_fields=[
                        'total_tokens_purchased', 
                        'token_quota',
                        'last_token_reset'
                    ])
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  ✅ Reset {company.name}: "
                            f"{old_quota:,} → {company.token_quota:,} tokens "
                            f"(+{monthly_allowance:,})"
                        )
                    )
                    reset_count += 1
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"  ❌ Error resetting {company.name}: {str(e)}"
                    )
                )
                error_count += 1
        
        # Résumé
        self.stdout.write(self.style.NOTICE("\n" + "="*60))
        self.stdout.write(self.style.NOTICE("SUMMARY"))
        self.stdout.write(self.style.NOTICE("="*60))
        self.stdout.write(f"Total companies: {total_companies}")
        self.stdout.write(self.style.SUCCESS(f"Reset: {reset_count}"))
        self.stdout.write(self.style.WARNING(f"Skipped: {skip_count}"))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"Errors: {error_count}"))
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠️  This was a DRY RUN. No changes were made. "
                    "Run without --dry-run to apply changes."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅ Monthly token reset completed successfully!"
                )
            )
