from django.db import migrations

class Migration(migrations.Migration):
    """
    Merges the conflicting migrations:
    - 0002_admin_access_key
    - 0002_adminaccesskey
    - 0002_chatconversation_chatmessage_userprofile_and_more
    """

    dependencies = [
        ('api', '0002_admin_access_key'),
        ('api', '0002_adminaccesskey'),
        ('api', '0002_chatconversation_chatmessage_userprofile_and_more'),
    ]

    operations = [
        # No operations needed, this migration just combines the migration history
    ]
