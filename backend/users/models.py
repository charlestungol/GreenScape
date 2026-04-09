from django.db import models
from django.contrib.auth.models import AbstractUser, Group
from django.contrib.auth.base_user import BaseUserManager
from django.core.validators import RegexValidator

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
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "employee")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        user = self.create_user(email, password, **extra_fields)

        #Assign superuser to SuperAdmin group for permissions
        superadmin_group, _ = Group.objects.get_or_create(name="SuperAdmin")
        user.groups.add(superadmin_group)

        return user

class CustomUser(AbstractUser):
    username = None
    first_name = None
    last_name = None

    # User email
    email = models.EmailField(max_length=200, unique=True)
    # Employee Number
    employee_number = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\d+$',
                message="Employee number must contain digits only."
            )
        ],
        help_text="Numeric employee identifier (employees only)",
    )
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
        ordering = ["id"]
    
    def __str__(self):
        label = self.email  or f"User#{self.pk}"
        return f"{label} ({self.role})"