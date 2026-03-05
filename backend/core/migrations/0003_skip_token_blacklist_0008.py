from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('token_blacklist', '0007_auto_20171017_2214'),
        ('core', '0002_initial'), 
    ]

    operations = [
        migrations.RunSQL(
            sql="SELECT 1;",
            reverse_sql="SELECT 1;",
        ),
    ]