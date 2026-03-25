from django.dispatch import receiver
from allauth.account.signals import email_confirmed
from allauth.account.models import EmailAddress
from django.conf import settings
from django.db.models.signals import post_save
from django.contrib.auth.models import Group
from core.models import Employee

@receiver(email_confirmed)
def activate_user_on_email_confirm(sender, request, email_address: EmailAddress, **kwargs):
    user = email_address.user
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=["is_active"])


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def setup_superuser_profile_and_groups(sender, instance, created, **kwargs):
    user = instance

    # Only run when superuser is FIRST CREATED — avoids recursion
    if not created or not user.is_superuser:
        return

    # 1) Ensure Admin group
    admin_group, _ = Group.objects.get_or_create(name="Admin")
    user.groups.add(admin_group)

    # 2) Ensure Employee profile (do NOT call employee.save() afterward)
    Employee.objects.get_or_create(
        user=user,
        defaults={"roleid": admin_group}
    )

    # 3) Ensure AllAuth verified email entry
    if user.email:
        EmailAddress.objects.update_or_create(
            user=user,
            email=user.email,
            defaults={"verified": True, "primary": True},
        )

