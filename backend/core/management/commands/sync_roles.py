
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.apps import apps


ROLE_POLICY = {
    # map DB RoleName -> list of Django codename permissions
    "Admin": ["add", "change", "delete", "view"],
    "Supervisor": ["view", "add", "change"],
    "Staff": ["view", "add"],
}

# Models that can be modified by permissions.
MODELS_IN_SCOPE = [
    "core.Booking",
    "core.Schedule",
    "core.Quotes",
    "core.Invoice",
    "core.Site",
    "core.Zone",
    "core.Service",
    "core.ServiceType",
    "core.Employee",
    "core.Customer",
    "core.Address",
    "core.ServiceImage",
    "core.CustomerService",
]



class Command(BaseCommand):
    help = "Sync role-based groups and attach CRUD permissions by model."

    def handle(self, *args, **kwargs):
        # Resolve content types / permissions for each model
        model_perms = {}  # (app_label, model) -> {action: Permission}
        for label in MODELS_IN_SCOPE:
            app_label, model_name = label.split(".")
            model = apps.get_model(app_label, model_name)
            perms = Permission.objects.filter(content_type__app_label=app_label,
                                              content_type__model=model._meta.model_name)
            action_map = {p.codename.split("_", 1)[0]: p for p in perms}  # add/change/delete/view
            model_perms[(app_label, model._meta.model_name)] = action_map

        # Create groups and apply permissions per role
        for role_name, actions in ROLE_POLICY.items():
            group, _ = Group.objects.get_or_create(name=role_name)
            # Start clean (comment out if you prefer incremental)
            group.permissions.clear()

            for action_map in model_perms.values():
                for action in actions:
                    perm = action_map.get(action)
                    if perm:
                        group.permissions.add(perm)

            self.stdout.write(self.style.SUCCESS(f"Synced group: {role_name}"))

        self.stdout.write(self.style.SUCCESS("Role groups successfully synced."))
