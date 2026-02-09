
from django.core.management import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.db import connections, transaction

ROLE_PERMS = {
    # map DB RoleName -> list of Django codename permissions
    "Admin": ["add", "change", "delete", "view"],
    "Supervisor": ["view", "add", "change"],
    "Staff": ["view", "add"],
}

# Models that can be modified by permissions.
MODELS_IN_SCOPE = [
    "core.Booking",
    "core.Schedule",
    "core.ServiceReport",
    "core.Quotes",
    "core.Invoice",
    "core.Site",
    "core.Zone",
    "core.Service",
    "core.AdditionalService",
    "core.ServiceType",
    "core.Roles",
]


class Command(BaseCommand):
    help = "Sync Roles table to Django Groups"

    def handle(self, *args, **kwargs):
        with connections['default'].cursor() as cur, transaction.atomic():
            cur.execute("SELECT RoleName FROM dbo.Roles;")
            for (role_name,) in cur.fetchall():
                group, _ = Group.objects.get_or_create(name=role_name)
                # Assign permissions based on ROLE_PERMS
                for pattern in ROLE_PERMS.get(role_name, []):
                    if pattern.endswith("_*"):
                        action = pattern[:-2]
                        perms = Permission.objects.filter(codename__startswith=f"{action}_")
                        group.permissions.add(*perms)
                    else:
                        try:
                            p = Permission.objects.get(codename=pattern)
                            group.permissions.add(p)
                        except Permission.DoesNotExist:
                            self.stderr.write(f"Missing permission: {pattern}")
                self.stdout.write(f"Synced group: {role_name}")
        self.stdout.write(self.style.SUCCESS("Done"))
