from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import Employee

@receiver(post_save, sender=Employee)
def sync_employee_group(sender, instance: Employee, **kwargs):
    user = getattr(instance, "user", None)
    role = getattr(instance, "roleid", None)

    if not user or not role:
        return

    group_name = role.name  # "Admin", "Supervisor", "Staff"

    try:
        group = Group.objects.get(name=group_name)
    except Group.DoesNotExist:
        return

    # assign correct group
    user.groups.remove(*Group.objects.filter(name__in=["Admin", "Supervisor", "Staff"]))
    user.groups.add(group)

    # Setting is_staff safely without saving here:
    if user.is_staff != (group_name == "Admin"):
        # Postpone save; handle is_staff during user creation, not here
        pass