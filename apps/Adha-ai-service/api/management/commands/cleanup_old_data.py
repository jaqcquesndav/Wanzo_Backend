"""
Django management command pour nettoyer les anciennes données.
À exécuter quotidiennement via cron job: 0 2 * * *
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import ProcessedMessage, ProcessingRequest

class Command(BaseCommand):
    help = 'Nettoie les anciennes données (messages traités, requêtes abandonnées)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--processed-messages-days',
            type=int,
            default=7,
            help='Nombre de jours à conserver pour ProcessedMessage (défaut: 7)',
        )
        parser.add_argument(
            '--completed-requests-days',
            type=int,
            default=30,
            help='Nombre de jours à conserver pour ProcessingRequest complétées (défaut: 30)',
        )
        parser.add_argument(
            '--abandoned-requests-hours',
            type=int,
            default=24,
            help='Nombre d\'heures avant de marquer une requête comme abandonnée (défaut: 24)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche ce qui serait supprimé sans effectuer les suppressions',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        processed_days = options['processed_messages_days']
        completed_days = options['completed_requests_days']
        abandoned_hours = options['abandoned_requests_hours']
        
        self.stdout.write(self.style.NOTICE(
            f"🧹 Starting cleanup (dry_run={dry_run})..."
        ))
        
        total_deleted = 0
        
        # 1. Nettoyer ProcessedMessage
        self.stdout.write(f"\n1️⃣  Cleaning ProcessedMessage older than {processed_days} days...")
        
        if dry_run:
            from datetime import timedelta
            cutoff = timezone.now() - timedelta(days=processed_days)
            count = ProcessedMessage.objects.filter(processed_at__lt=cutoff).count()
            self.stdout.write(
                self.style.WARNING(f"  [DRY RUN] Would delete {count} ProcessedMessage records")
            )
        else:
            count = ProcessedMessage.cleanup_old_records(days=processed_days)
            self.stdout.write(
                self.style.SUCCESS(f"  ✅ Deleted {count} ProcessedMessage records")
            )
            total_deleted += count
        
        # 2. Marquer requêtes abandonnées comme timeout
        self.stdout.write(f"\n2️⃣  Marking abandoned ProcessingRequest (>{abandoned_hours}h)...")
        
        if dry_run:
            from datetime import timedelta
            cutoff = timezone.now() - timedelta(hours=abandoned_hours)
            count = ProcessingRequest.objects.filter(
                status='processing',
                started_at__lt=cutoff
            ).count()
            self.stdout.write(
                self.style.WARNING(f"  [DRY RUN] Would mark {count} requests as timeout")
            )
        else:
            count = ProcessingRequest.cleanup_abandoned_requests(hours=abandoned_hours)
            self.stdout.write(
                self.style.SUCCESS(f"  ✅ Marked {count} abandoned requests as timeout")
            )
        
        # 3. Nettoyer ProcessingRequest complétées/échouées
        self.stdout.write(f"\n3️⃣  Cleaning completed ProcessingRequest older than {completed_days} days...")
        
        if dry_run:
            from datetime import timedelta
            cutoff = timezone.now() - timedelta(days=completed_days)
            count = ProcessingRequest.objects.filter(
                completed_at__lt=cutoff,
                status__in=['completed', 'failed', 'timeout']
            ).count()
            self.stdout.write(
                self.style.WARNING(f"  [DRY RUN] Would delete {count} ProcessingRequest records")
            )
        else:
            count = ProcessingRequest.cleanup_old_requests(days=completed_days)
            self.stdout.write(
                self.style.SUCCESS(f"  ✅ Deleted {count} ProcessingRequest records")
            )
            total_deleted += count
        
        # Résumé
        self.stdout.write(self.style.NOTICE("\n" + "="*60))
        self.stdout.write(self.style.NOTICE("SUMMARY"))
        self.stdout.write(self.style.NOTICE("="*60))
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "⚠️  This was a DRY RUN. No changes were made.\n"
                    "Run without --dry-run to apply changes."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Cleanup completed! Total records deleted: {total_deleted}"
                )
            )
