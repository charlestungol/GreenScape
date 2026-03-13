
# ---------------------------------------------------
# Django Core & Authentication
# ---------------------------------------------------
from django.contrib.auth import authenticate, get_user_model, password_validation
from django.core import exceptions
from django.contrib.auth.models import Group
from django.db import transaction


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

ALLOWED_GROUPS = ["Admin", "Supervisor", "Staff"]

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
    first_name = serializers.CharField(required=True, write_only = True, validators=[strip_string, prevent_control_characters, validate_name])
    last_name = serializers.CharField(required=True, write_only = True, validators=[strip_string, prevent_control_characters, validate_name])
    phone = serializers.CharField(required=True, write_only = True, validators=[strip_string, prevent_control_characters, validate_phone])
    address = AddressSerializer(required=True, write_only = True)
    password = serializers.CharField(write_only=True, validators=[strip_string, validate_max_length(16)])

    class Meta:
        model = User
        fields = ["id", "email", "password", "first_name", "last_name", "phone", "address"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_email(self, value):
        email = normalize_email(value or "")
        if not email:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email_iexact=email).exists():
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
        first_name = validated_data.pop("first_name", "").strip()
        last_name = validated_data.pop("last_name", "").strip()
        address_data = validated_data.pop("address")
        phone_number = validated_data.pop('phone')
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

        # Create Address
        address = Address.objects.create(**address_data)

        # Create Customer
        customer = Customer.objects.create(
            user = user,
            firstname = first_name.strip(),
            lastname = last_name.strip(),
            phonenumber = phone_number.strip(),
            addressid = address,
        )

        return user


class EmployeeLoginSerializer(serializers.Serializer):
    employee_number = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, data):
        request = self.context.get("request")

        employee_number = (data.get("employee_number") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        # Let DRF required fields handle empties, but keep this if you want one message
        if not email or not password or not employee_number:
            raise serializers.ValidationError("Email, password, and employee number are required.")

        user = authenticate(request=request, email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password")

        # If you are using email verification to activate accounts
        if not user.is_active:
            raise serializers.ValidationError("Account not active. Please verify your email.")

        if user.role != "employee":
            raise serializers.ValidationError("This is not an employee account")

        # Verify email using allauth EmailAddress table
        is_verified = EmailAddress.objects.filter(
            user=user,
            email__iexact=user.email,
            verified=True
        ).exists()

        if not is_verified:
            raise serializers.ValidationError("Email not verified. Please check your inbox.")

        if not user.employee_number:
            raise serializers.ValidationError("Employee number missing for this account")

        if str(user.employee_number).strip() != employee_number:
            raise serializers.ValidationError("Invalid employee number")

        data["user"] = user
        return data



# Create a user, and add an employee to db
class EmployeeRegisterSerializer(serializers.ModelSerializer):
    group = serializers.ChoiceField(write_only=True, required=True, choices=ALLOWED_GROUPS, validators=[strip_string, prevent_control_characters, validate_max_length(254)])
    # first_name = serializers.CharField(write_only=True, required=True, max_length=50, validators=[strip_string, prevent_control_characters])
    # last_name = serializers.CharField(write_only=True, required=True, max_length=50, validators=[strip_string, prevent_control_characters])
    employee_number = serializers.CharField(write_only=True, required=True, max_length=50, validators=[strip_string, prevent_control_characters])
    # staff_status = serializers.ChoiceField( write_only=True, required=False, choices=[("Active", "Active"), ("Inactive", "Inactive")], default="Active")
    # phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=10, validators=[strip_string, prevent_control_characters, validate_phone])
    password = serializers.CharField(write_only=True, validators=[strip_string, validate_max_length(16)])

    class Meta:
        model = User
        fields = ["id", "email", "password", "employee_number", "group"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_email(self, value):
        return normalize_email(value)
    
    def validate_password(self, value):
        try:
            password_validation.validate_password(value)
        except exceptions.ValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        group_name = validated_data.pop("group")
        is_staff = str(group_name).lower() == "admin"

        # Create the user
        user = User.objects.create_user(
            **validated_data,
            is_active=False,
            is_staff=is_staff,
            role="employee"
        )

        # Filter for the group
        grp = Group.objects.filter(name__iexact=group_name).first()
        if not grp:
            grp = Group.objects.create(name=group_name.title())

        # Create employee data
        employee = Employee.objects.create(
            roleid = grp,
            user = user
        )

        # Add the group to the user
        user.groups.add(grp)

        # Return the user
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
        if hasattr(user, "cusomer") and user.customer is not None:
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
    new_email = serializers.EmailField(required=True, validators=[strip_string, validate_max_length(254)])
    password = serializers.CharField(required=True, write_only=True, validators=[strip_string, validate_max_length(16)])
    def validate_new_email(self, value):
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