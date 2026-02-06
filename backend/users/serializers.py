from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate, password_validation
from django.core import exceptions
from allauth.account.models import EmailAddress
from core.serializers import AddressSerializer
from core.models import Address, Customer
from django.db import transaction

# Get the User model
User = get_user_model()

# Function to normalize email by stripping whitespace and converting to lowercase
def normalize_email(value: str) -> str:
    return (value or "").strip().lower()

# Serializer for client login, validates email and password, checks if email is verified and account is active, and ensures the user has a client role.
class ClientLoginSerializer(serializers.Serializer):
    # Fields for email and password
    email = serializers.EmailField()
    # Password field is write-only to ensure it is not included in serialized output
    password = serializers.CharField(write_only=True)

    # Validation method to authenticate the user and check various conditions
    def validate(self, data):
        # Normalize the email and get the password from the input data
        email = normalize_email(data["email"])
        #get the password from the input data
        password = data["password"]

        # Check if email and password are provided, if not raise a validation error
        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")
        
        # Authenticate the user using the provided email and password
        user = User.objects.filter(email__iexact=email).first()

        if user and user.check_password(password):
            is_verified = EmailAddress.objects.filter(user=user, email=user.email, verified=True).exists()
        if not is_verified:
            EmailAddress.objects.add_email(
                self.context.get("request"),
                user,
                user.email,
                confirm=True
            )
            raise serializers.ValidationError("Email not verified. Please check your inbox.")
        
        if not getattr(user, "is_active", True):
            raise serializers.ValidationError("Account is inactive. Contact support")
        if user.role != "client":
            raise serializers.ValidationError("Not a client account")
        
        authed = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password
        )
        # If authentication fails, raise a validation error indicating invalid credentials
        if not authed:
            raise serializers.ValidationError("Invalid credentials")

        if getattr(authed, "role", None) != "client":
            raise serializers.ValidationError("Not a client account")
        
        data["user"] = authed

        return data


# Serializer for client registration, includes fields for email, password, first name, last name, phone number, and address. 
# Validates email and password, and creates a new user, address, and customer record in the database within an atomic transaction.
class ClientRegisterSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=True, write_only = True)
    address = AddressSerializer(required=True)

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
        employee_number = data["employee_number"]
        email = data["email"]
        password = data["password"]

        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password
        )

        if not user:
            raise serializers.ValidationError("Invalid email or password")

        if user.role != "employee":
            raise serializers.ValidationError("This is not an employee account")

        if not user.employee_number:
            raise serializers.ValidationError("Employee number missing for this account")

        if str(user.employee_number) != str(employee_number):
            raise serializers.ValidationError("Invalid employee number")

        data["user"] = user
        return data



class EmployeeRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "password", "first_name", "last_name", "employee_number"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            **validated_data,
            is_staff=True,
            role="employee"
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters.")
        return value