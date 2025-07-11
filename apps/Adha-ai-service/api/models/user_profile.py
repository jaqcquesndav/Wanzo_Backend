from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

# We'll keep the signal handlers but won't create profiles automatically
# Instead profiles will be created explicitly during signup
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile instance when the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
