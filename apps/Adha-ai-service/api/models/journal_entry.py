from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

class JournalEntry(models.Model):
    """
    Model representing a journal entry in the accounting system.
    """
    date = models.DateField(_("Date"))
    piece_reference = models.CharField(_("Piece Reference"), max_length=50, blank=True)
    description = models.CharField(_("Description"), max_length=255)
    debit_data = models.JSONField(_("Debit Entries"), default=list)
    credit_data = models.JSONField(_("Credit Entries"), default=list)
    journal = models.CharField(_("Journal"), max_length=10, default="JO")
    source_data = models.JSONField(_("Source Data"), default=dict, blank=True)
    source_type = models.CharField(_("Source Type"), max_length=20, default="manual", 
                                  choices=[
                                      ("manual", "Manual Entry"),
                                      ("document", "Document"),
                                      ("prompt", "Natural Language Prompt"),
                                      ("import", "Data Import"),
                                  ])
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name="journal_entries")
    is_verified = models.BooleanField(_("Is Verified"), default=False)
    verification_notes = models.TextField(_("Verification Notes"), blank=True)
    
    class Meta:
        verbose_name = _("Journal Entry")
        verbose_name_plural = _("Journal Entries")
        ordering = ["-date", "-created_at"]
        
    def __str__(self):
        return f"{self.date} - {self.description} ({self.piece_reference})"
    
    def clean(self):
        """Validate the journal entry."""
        # Ensure both debit_data and credit_data are lists
        if not isinstance(self.debit_data, list) or not isinstance(self.credit_data, list):
            raise ValidationError(_("Debit and credit entries must be lists"))
        
        # Validate the balance
        debit_total = sum(entry.get('montant', 0) for entry in self.debit_data)
        credit_total = sum(entry.get('montant', 0) for entry in self.credit_data)
        
        if round(debit_total, 2) != round(credit_total, 2):
            raise ValidationError(_(f"Journal entry is not balanced. Debit: {debit_total}, Credit: {credit_total}"))
    
    def save(self, *args, **kwargs):
        # Run validation before saving, unless skip_validation is passed
        if not kwargs.pop('skip_validation', False):
            self.clean()
        super().save(*args, **kwargs)
