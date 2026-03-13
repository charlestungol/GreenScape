from django.db import migrations


def seed_data(apps, schema_editor):
    Servicetype = apps.get_model("core", "Servicetype")
    Service = apps.get_model("core", "Service")

    # 1) Seed service types (≤ 10 chars each)
    types = [
        {"typecode": "INSTALL", "typename": "Install"},
        {"typecode": "MAINT",   "typename": "Maint"},
        {"typecode": "WINTER",  "typename": "Winter"},
    ]
    for t in types:
        Servicetype.objects.update_or_create(
            typecode=t["typecode"],
            defaults=t
        )

    # Fetch types
    install = Servicetype.objects.get(typecode="INSTALL")
    maint   = Servicetype.objects.get(typecode="MAINT")
    winter  = Servicetype.objects.get(typecode="WINTER")

    # 2) Seed services (respect title<=15, description<=50)
    services = [
        {"servicetype": install, "title": "Irrigation", "description": "Irrigation Install",    "baseprice": "1500.00"},
        {"servicetype": maint,   "title": "Seasonal",   "description": "Seasonal Maintenance",  "baseprice": "200.00"},
        {"servicetype": winter,  "title": "Winterize",  "description": "System Winterization",  "baseprice": "180.00"},
    ]
    for s in services:
        Service.objects.update_or_create(
            servicetype=s["servicetype"],
            title=s["title"],
            defaults={"description": s["description"], "baseprice": s["baseprice"]},
        )

def unseed_data(apps, schema_editor):
    Servicetype = apps.get_model("core", "Servicetype")
    Service = apps.get_model("core", "Service")

    Service.objects.filter(title__in=["Irrigation", "Seasonal", "Winterize"]).delete()
    Servicetype.objects.filter(typecode__in=["INSTALL", "MAINT", "WINTER"]).delete()

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_initial"),
    ]
    operations = [
        migrations.RunPython(seed_data, reverse_code=unseed_data),
    ]
