from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from django.conf import settings

from .models import Employee

# Signal receiver to sync Employee's associated User's group membership based on their Role.
@receiver(post_save, sender=Employee)
def sync_employee_group(sender, instance: Employee, **kwargs):
    
    # Ensure the Employee's associated Django User is in the correct Group
    # based on the Role (Roles.rolename: Admin | Supervisor | Staff).
    
    user = getattr(instance, "user", None)  # assumes Employee has OneToOne/ForeignKey to auth.User
    role = getattr(instance, "roleid", None)  # FK to Roles

    if not user or not role:
        return

    # Normalize group name off Roles.rolename (must match your ROLE_POLICY keys)
    group_name = role.name  # "Admin", "Supervisor", or "Staff"
    try:
        group = Group.objects.get(name=group_name)
    except Group.DoesNotExist:
        return  # or log a warning

    # Remove from other role groups, then add the correct one
    user.groups.remove(*Group.objects.filter(name__in=["Admin", "Supervisor", "Staff"]))
    user.groups.add(group)

    # Optional: Decide who gets is_staff
    # If you only want Admin/Supervisor to access Django admin:
    user.is_staff = group_name in {"Admin", "Supervisor"}
    user.save(update_fields=["is_staff"])