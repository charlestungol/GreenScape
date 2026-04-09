# ---------------------------------------------------
# Django Core & Authentication
# ---------------------------------------------------
from django.contrib.auth import authenticate, get_user_model, password_validation
from django.core import exceptions
from django.contrib.auth.models import Group
from django.db import transaction

# ---------------------------------------------------
# Model Imports
# ---------------------------------------------------
from .models import CustomUser

# ---------------------------------------------------
# Django Allauth
# ---------------------------------------------------
from allauth.account.models import EmailAddress


# ---------------------------------------------------
# Django REST Framework
# ---------------------------------------------------
from rest_framework import serializers


# ---------------------------------------------------
# Project App Imports
# ---------------------------------------------------
from core.models import Address, Customer, Employee
from core.serializers import AddressSerializer
from core.management.validators import (
    validate_phone,
    validate_name,
    validate_max_length,
    prevent_control_characters,
    strip_string,
)


# Get the User model
User = get_user_model()

ALLOWED_GROUPS = [
    ("Admin", "Admin"),
    ("Supervisor", "Supervisor"),
    ("Staff", "Staff"),
]

# Function to normalize email by stripping whitespace and converting to lowercase
def normalize_email(value: str) -> str:
    return (value or "").strip().lower()

# Serializer for client login, validates email and password, checks if email is verified and account is active, and ensures the user has a client role.
class ClientLoginSerializer(serializers.Serializer):
    # Fields for email and password
    email = serializers.EmailField(validators=[strip_string, validate_max_length(254)])
    # Password field is write-only to ensure it is not included in serialized output
    password = serializers.CharField(write_only=True, validators=[strip_string, validate_max_length(254)])

    # Validation method to authenticate the user and check various conditions
    def validate(self, data):
        # Normalize the email by stripping whitespace and converting to lowercase
        email = normalize_email(data.get("email"))
        password = data.get("password")

        # Check if email and password are provided, if not raise a validation error
        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")
    
        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password
        )

        if not user:
            raise serializers.ValidationError("Invalid email or password")

        if user.role != "client":
            raise serializers.ValidationError("This is not a client account")

        # Check if the user's email address is verified using the EmailAddress model from allauth
        email_verified = EmailAddress.objects.filter(user=user, email__iexact=user.email, verified=True).exists()
        if not email_verified:
            raise serializers.ValidationError("Email not verified. Please check your inbox.")

        data["user"] = user
        return data


# Serializer for client registration, includes fields for email, password, first name, last name, phone number, and address. 
# Validates email and password, and creates a new user, address, and customer record in the database within an atomic transaction.
class ClientRegisterSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ["id", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_email(self, value):
        email = normalize_email(value or "")
        if not email:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email
    
    def validate_password(self, value):
        try:
            password_validation.validate_password(value)
        except exceptions.ValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")

        # Create new user
        user = User.objects.create_user(
            email =  email,
            password = password,
            is_active = False,
            **validated_data,
            role="client"
        )

        return user


class EmployeeLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    employee_number = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, data):
        email = data["email"].strip().lower()
        employee_number = (data.get("employee_number") or "").strip()
        password = data["password"]

        #Authenticate by email + password
        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password,
        )

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        if not user.is_active:
            raise serializers.ValidationError("Account not active")

        #SUPERUSER BYPASS (VERY IMPORTANT)
        if user.is_superuser:
            data["user"] = user
            return data

        #Email verification for all non-superusers
        if not EmailAddress.objects.filter(
            user=user,
            email__iexact=user.email,
            verified=True
        ).exists():
            raise serializers.ValidationError(
                "Email not verified. Please check your inbox."
            )

        #Role logic based on GROUPS
        groups = set(user.groups.values_list("name", flat=True))

        # Only real employees must provide employee_number
        if groups & {"Staff", "Supervisor", "Admin"}:
            if not employee_number:
                raise serializers.ValidationError({
                    "employee_number": "Employee number is required."
                })

            if user.employee_number != employee_number:
                raise serializers.ValidationError("Invalid credentials")

        #Admin / SuperAdmin skip employee_number checks
        data["user"] = user
        return data

# Serializer for employee registration, includes fields for email, password, employee number, and group.
class EmployeeRegisterSerializer(serializers.ModelSerializer):
    group = serializers.ChoiceField(
        write_only=True,
        required=True,
        choices=ALLOWED_GROUPS
    )

    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8
    )

    employee_number = serializers.CharField(
        write_only=True,
        required=True
    )

    class Meta:
        model = User
        fields = ["email", "password", "employee_number", "group"]

    #EMAIL UNIQUENESS
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email address is already in use."
            )
        return value

    #EMPLOYEE NUMBER UNIQUENESS
    def validate_employee_number(self, value):
        if User.objects.filter(employee_number=value).exists():
            raise serializers.ValidationError(
                "This employee number is already in use."
            )
        return value

    def create(self, validated_data):
        group_name = validated_data.pop("group")
        password = validated_data.pop("password")
        employee_number = validated_data.pop("employee_number")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=password,
            role="employee",
            employee_number=employee_number,
            is_active=False,  # invite-style flow
        )

        group = Group.objects.get(name=group_name)
        user.groups.add(group)

        return user


#For Customer to compelete their profile
class CompleteCustomerProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True, validators=[strip_string, prevent_control_characters, validate_name])
    last_name = serializers.CharField(required=True, validators=[strip_string, prevent_control_characters, validate_name])
    phone = serializers.CharField(required=True, validators=[strip_string, prevent_control_characters, validate_phone])
    address = AddressSerializer(required=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        if hasattr(user, "customer") and user.customer is not None:
            raise serializers.ValidationError("Customer profile  already exists.")
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        addr_data = validated_data.pop("address")
        first_name = validated_data.pop("first_name").strip()
        last_name = validated_data.pop("last_name").strip()
        phone = validated_data.pop("phone").strip()

        address = Address.objects.create(**addr_data)
        customer = Customer.objects.create(
            user = user,
            firstname = first_name,
            lastname = last_name,
            phonenumber=phone,
            addressid = address,
        )

        return customer


#Serializer to allow user to change their email.
class ChangeEmailSerializer(serializers.Serializer):
    new_email = serializers.EmailField(
        required=True,
        validators=[strip_string, validate_max_length(254)]
    )
    # Allow longer passwords; 128 is common
    password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[strip_string, validate_max_length(16)]
    )

    def validate_new_email(self, value):
        # normalize_email already handles trimming & case
        return normalize_email(value)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, validators=[strip_string, validate_max_length(16)])
    new_password = serializers.CharField(required=True, validators=[strip_string, validate_max_length(16)])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters.")
        return value

# Serializer to allow user to update their group. 
# This is primarily for admin use, but can be used by users to request a group change. 
# The view should enforce permissions as needed.
class UserGroupUpdateSerializer(serializers.Serializer):
    group = serializers.CharField()

    def validate_group(self, value):
        if not Group.objects.filter(name=value).exists():
            raise serializers.ValidationError("Invalid group")
        return value

# Serializer for user information, includes a method field to get the user's role based on their group. 
# This is read-only and used for displaying user information in the admin interface or user management views.
class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "role"]

    def get_role(self, obj):
        group = obj.groups.first()
        return group.name if group else None

# For employee management views, we need to include employee_number and role/group information.
class EmployeeAccountSerializer(serializers.ModelSerializer):
    group = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "employee_number",
            "role",
            "group",
            "is_active",
        ]

    def get_group(self, obj):
        group = obj.groups.first()
        return group.name if group else None


