from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

class UserProfile(models.Model):
    """Extended user profile for the Adha AI service."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    company = models.ForeignKey('Company', on_delete=models.CASCADE, null=True, blank=True)
    is_company_admin = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.username}"
    
    class Meta:
        verbose_name = _("User Profile")
        verbose_name_plural = _("User Profiles")

# We'll keep the signal handlers but won't create profiles automatically
# Instead profiles will be created explicitly during signup
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile instance when the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
