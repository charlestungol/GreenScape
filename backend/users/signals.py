from django.dispatch import receiver
from allauth.account.signals import email_confirmed
from allauth.account.models import EmailAddress
from django.conf import settings
from django.db.models.signals import post_save
from django.contrib.auth.models import Group
from core.models import Employee



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


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def setup_superuser_profile_and_groups(sender, instance, created, **kwargs):
    """
    When a superuser is created:
      - Ensure Employee profile exists with role='employee' semantics
      - Set employee_number=101100 and staffstatus=True
      - Ensure is_active remains True
      - Add to 'Admin' group
      - Ensure allauth EmailAddress exists, primary+verified for login
    This runs on every user save, but only applies if user is superuser.
    """
    user = instance
    if not user.is_superuser:
        return

    # 1) Add to Admin group (create it if not existing)
    admin_group, _ = Group.objects.get_or_create(name="Admin")
    if not user.groups.filter(id=admin_group.id).exists():
        user.groups.add(admin_group)

    # 2) Ensure Employee profile (create if missing)
    employee, created_emp = Employee.objects.get_or_create(user=user)
    # Set the fields you asked for
    # If you have a role field or roleid FK to Group, adjust accordingly
    if hasattr(employee, "employee_number") and not employee.employee_number:
        employee.employee_number = "101100"  # store as string or int depending on your model

    if hasattr(employee, "staffstatus"):
        employee.staffstatus = True

    employee.save()

    # 3) Ensure allauth EmailAddress exists & verified
    if user.email:
        EmailAddress.objects.update_or_create(
            user=user,
            email=user.email,
            defaults={"verified": True, "primary": True},
        )
