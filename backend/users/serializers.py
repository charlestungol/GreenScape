from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate, password_validation
from django.contrib.auth.models import Group
from django.core import exceptions
from allauth.account.models import EmailAddress
from core.serializers import AddressSerializer
from core.models import Address, Customer, Employee
from django.db import transaction
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
    email = serializers.EmailField(validators=[strip_string, prevent_control_characters, validate_max_length(254)])
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
    phone = serializers.CharField(required=True, write_only = True, validators=[strip_string, prevent_control_characters, validate_phone])
    address = AddressSerializer(required=True, validators=[strip_string, prevent_control_characters, validate_max_length(254), validate_name])

    class Meta:
        model = User
        fields = ["id", "email", "password", "first_name", "last_name", "phone", "address"]
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
            firstname = user.first_name,
            lastname = user.last_name,
            email = user.email,
            phonenumber = phone_number,
            addressid = address,
        )

        return user



class EmployeeLoginSerializer(serializers.Serializer):
    employee_number = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Validate the employee's credentials and ensure they have the correct role and employee number.
        employee_number = data["employee_number"]
        # Normalize the email by stripping whitespace and converting to lowercase
        email = data["email"]
        # Get the password from the input data
        password = data["password"]

        # Check if email, password, and employee number are provided, if not raise a validation error
        if not email or not password or not employee_number:
            raise serializers.ValidationError("Email, password, and employee number are required.")
    
        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password
        )
        
        if not user:
            raise serializers.ValidationError("Invalid email or password")

        if user.role != "employee":
            raise serializers.ValidationError("This is not an employee account")

        is_verified = EmailAddress.objects.filter(user=user, email__iexact=user.email, verified=True).exists()
        if not is_verified:
            raise serializers.ValidationError("Email not verified. Please check your inbox.")
        
        if not user.employee_number:
            raise serializers.ValidationError("Employee number missing for this account")

        if str(user.employee_number) != str(employee_number):
            raise serializers.ValidationError("Invalid employee number")

        data["user"] = user
        return data


# Create a user, and add an employee to db
class EmployeeRegisterSerializer(serializers.ModelSerializer):
    group = serializers.ChoiceField(write_only=True, required=True, choices=ALLOWED_GROUPS, validators=[strip_string, prevent_control_characters, validate_max_length(254)])
    first_name = serializers.CharField(write_only=True, required=True, max_length=50, validators=[strip_string, prevent_control_characters])
    last_name = serializers.CharField(write_only=True, required=True, max_length=50, validators=[strip_string, prevent_control_characters])
    staff_status = serializers.BooleanField(write_only=True, required=False, allow_null=True, default=False)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=20, validators=[strip_string, prevent_control_characters, validate_phone])

    class Meta:
        model = User
        fields = ["id", "email", "password", "first_name", "last_name", "staff_status", "phone_number", "group"]
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
        first_name = validated_data.pop("first_name")
        last_name = validated_data.pop("last_name")
        staff_status = validated_data.pop("staff_status", False)
        group_name = validated_data.pop("group")
        phone_number = validated_data.pop("phone_number", "")

        user = User.objects.create_user(
            **validated_data,
            is_active = False,
            is_staff=False,
            role="employee"
        )

        try:
            grp = Group.objects.get(name__iexact=group_name)
        except Group.DoesNotExist:
            grp = Group.objects.create(name=group_name.title())

        user.groups.add(grp)

        Employee.objects.create(
            user=user,
            addressid=None,
            firstname=first_name,
            lastname=last_name,
            phonenumber=phone_number,
            staffstatus=staff_status
        )

        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, validators=[strip_string, validate_max_length(254)])
    new_password = serializers.CharField(required=True, validators=[strip_string, validate_max_length(254)])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters.")
        return value