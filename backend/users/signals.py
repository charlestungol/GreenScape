from django.dispatch import receiver
from allauth.account.signals import email_confirmed
from allauth.account.models import EmailAddress

# This signal handler listens for the email_confirmed signal from django-allauth. 
# When a user's email is confirmed, this function checks if the associated user account is inactive. 
# If it is, the function activates the user account by setting is_active to True and saving the user. 
# This allows users to log in immediately after confirming their email without requiring manual activation by an admin.
@receiver(email_confirmed)
def activate_user_on_email_confirm(sender, request, email_address: EmailAddress, **kwargs):

    user = email_address.user
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=["is_active"])