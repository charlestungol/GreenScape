# apps/core/migrations/0004_seed_services.py
from django.db import migrations
 
def seed_services(apps, schema_editor):
    Service = apps.get_model("core", "Service")
    services = [
        {"slug": "irrigation-install", "name": "Irrigation Install", "default_price": "1500.00"},
        {"slug": "seasonal-maintenance", "name": "Seasonal Maintenance", "default_price": "200.00"},
        {"slug": "winterization", "name": "Winterization", "default_price": "180.00"},
    ]
    for s in services:
        Service.objects.update_or_create(slug=s["slug"], defaults=s)
 
def unseed_services(apps, schema_editor):
    Service = apps.get_model("core", "Service")
    Service.objects.filter(slug__in=[
        "irrigation-install", "seasonal-maintenance", "winterization"
    ]).delete()
 
class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]
    operations = [
        migrations.RunPython(seed_services, reverse_code=unseed_services),
    ]
