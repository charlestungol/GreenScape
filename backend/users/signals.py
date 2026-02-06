from django.dispatch import receiver
from allauth.account.signals import email_confirmed
from allauth.account.models import EmailAddress

@receiver(email_confirmed)
def activate_user_on_email_confirm(sender, request, email_address: EmailAddress, **kwargs):

    user = email_address.user
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=["is_active"])