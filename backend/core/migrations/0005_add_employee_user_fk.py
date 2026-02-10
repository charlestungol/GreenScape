# core/migrations/00XX_add_employee_user_fk.py
from django.db import migrations

SQL = r"""
IF COL_LENGTH('dbo.Employee','UserId') IS NULL
BEGIN
    ALTER TABLE dbo.Employee ADD UserId BIGINT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Employee_User')
BEGIN
    ALTER TABLE dbo.Employee WITH CHECK
      ADD CONSTRAINT FK_Employee_User FOREIGN KEY (UserId)
      REFERENCES dbo.users_customuser (id);
    ALTER TABLE dbo.Employee CHECK CONSTRAINT FK_Employee_User;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Employee_UserId' AND object_id = OBJECT_ID('dbo.Employee'))
BEGIN
    CREATE INDEX IX_Employee_UserId ON dbo.Employee(UserId);
END;
"""

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0005_booking_invoice_quotes_roles_schedule_servicetype_and_more'),  # adjust to your last core migration
    ]
    operations = [
        migrations.RunSQL(SQL, migrations.RunSQL.noop),
    ]
