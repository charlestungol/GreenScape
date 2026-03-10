from django.contrib import admin
from .models import CustomUser
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

# The UserCreationForm is used in the admin interface to create new users. It includes fields for email, role, employee number, and password. The password fields are handled by the built-in UserCreationForm logic, which ensures that passwords are properly hashed and validated.
class CustomUserCreationForm(UserCreationForm):
    """
    Admin 'Add user' form that uses email instead of username.
    """
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ("email", "role", "employee_number")

# Note: The UserChangeForm is used in the admin interface to edit existing users. It includes all fields that an admin might want to change, such as permissions and group memberships.
class CustomUserChangeForm(UserChangeForm):
    """
    Admin 'Change user' form that uses email instead of username.
    """
    class Meta:
        model = CustomUser
        fields = ("email", "role", "employee_number", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm   # <— important: avoid username on add form
    form = CustomUserChangeForm         # <— used for change form
    model = CustomUser

    list_display = ("email", "role", "employee_number", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active", "role", "groups")
    search_fields = ("email", "employee_number")
    ordering = ("email",)

    # Readonly timestamps from AbstractUser
    readonly_fields = ("last_login", "date_joined")

    # Fields shown on the change form
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Role / Employee", {"fields": ("role", "employee_number")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    # Fields shown on the add form
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "role", "employee_number",
                       "is_active", "is_staff", "is_superuser", "groups"),
        }),
    )
