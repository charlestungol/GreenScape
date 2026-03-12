from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.db.models import Q

class CustomManager(BaseUserManager):

    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is a required field')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)  # Ensure superusers are active by default

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        if extra_fields.get('is_active') is not True:
            raise ValueError('Superuser must have is_active=True.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    username = None
    first_name = None
    last_name = None

    # User email
    email = models.EmailField(max_length=200, unique=True)

    # Employee Number
    employee_number = models.CharField(max_length=50, null=True, blank=True)
    
    # Assign Google Account to user
    google_sub = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    avatar_url = models.URLField(null=True, blank=True)


    role = models.CharField(
        max_length=20,
        choices=(
            ("client", "Client"),
            ("employee", "Employee")
        )
    )

    objects = CustomManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users_customuser"
        constraints = [
            models.UniqueConstraint(fields=["employee_number"], name="uq_employee_number_not_null", condition=models.Q(employee_number__isnull=False) & ~Q(employee_number=""),),
            models.UniqueConstraint(fields=["google_sub"], name="uq_google_sub_present", condition=Q(google_sub__isnull=False) & ~Q(google_sub=""),),
            models.CheckConstraint(name="ck_employee_has_number", check=Q(role="employee",  employee_number__isnull=False) & ~Q(employee_number="") | ~Q(role="employee"),),
            models.CheckConstraint(name="ck_client_no_emp_number", check=Q(role="client", employee_number__isnull=True) | Q(role="client", employee_number="") | Q(role="client"),),
        ]
    
    def __str__(self):
        label = self.email  or f"User#{self.pk}"
        return f"{label} ({self.role})"