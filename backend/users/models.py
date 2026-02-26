from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

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
    email = models.EmailField(max_length=200, unique=True)
    username = models.CharField(max_length=200, null=True, blank=True)
    first_name = models.CharField(max_length=150, null=True, blank=True)
    last_name = models.CharField(max_length=150, null=True, blank=True)
    birthday = models.DateField(null=True, blank=True)
    employee_number = models.CharField(max_length=50, null=True, blank=True)

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

    def __str__(self):
        return f"{self.email} ({self.role})"
    
    class Meta:
        db_table = "users_customuser"

# -----------------------------------------------------
# Old user model, replaced by allauth's built in user model. Keeping this here for reference in case we need to revert back to a custom user model in the future.
# -----------------------------------------------------
# #Sign Up/Sign in
# class CustomManager(BaseUserManager):

#     use_in_migrations = True

#     def create_user(self, email, password=None, **extra_fields):
#         if not email:
#             raise ValueError('Email is a required field')
        
#         email = self.normalize_email(email)
#         user = self.model(email=email, **extra_fields)
#         user.set_password(password)
#         user.save(using=self._db)
#         return user
    
#     def create_superuser(self, email, password=None, **extra_fields):
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)
#         return self.create_user(email, password, **extra_fields)

# class CustomUser(AbstractUser):
#     email = models.EmailField(max_length=200, unique=True)
#     username = models.CharField(max_length=200, null=True, blank=True)
#     first_name = models.CharField(max_length=150, null=True, blank=True)
#     last_name = models.CharField(max_length=150, null=True, blank=True)
#     birthday = models.DateField(null=True, blank=True)
#     employee_number = models.CharField(max_length=50, null=True, blank=True)

#     role = models.CharField(
#         max_length=20,
#         choices=(
#             ("client", "Client"),
#             ("employee", "Employee")
#         )
#     )

#     objects = CustomManager()

#     USERNAME_FIELD = "email"
#     REQUIRED_FIELDS = []  

#     def __str__(self):
#         return f"{self.email} ({self.role})"
    
#     class Meta:
#         db_table = "users_customuser"