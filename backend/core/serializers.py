from rest_framework import serializers
from django.db import transaction
from core.management.validators import (
    validate_name,
    validate_postal_code,
    validate_province,
    validate_phone,
    validate_amount,
    validate_not_past,
    strip_string,
    prevent_control_characters,
    validate_max_length,
    validate_not_past_date,
    validate_not_past_year,
)
from .models import (
    Address,
    Customer,
    Employee,
    Service,
    Customerservice,
    ServiceImage,
    Site,
    Zone,
    Servicetype,
    Booking,
    Invoice,
    Quotes,
    Schedule,
    UserImage,
    RequestQuote,
    ServiceLocation,
    Budget,
    Expense,
    LocationService
);


# Address
class AddressSerializer(serializers.ModelSerializer):
    # Custom validators for address fields
    street = serializers.CharField(validators=[prevent_control_characters, validate_max_length(120)])
    city = serializers.CharField(validators=[strip_string, prevent_control_characters, validate_max_length(50)])
    province = serializers.CharField(validators=[validate_province])
    postalcode = serializers.CharField(validators=[validate_postal_code])

    class Meta:
        model = Address
        fields =  ["addressid", "street", "city", "province", "postalcode"]
        read_only_fields=["addressid"]

    # Custom create and update methods to handle nested serialization if needed in the future. For now, they just call the default implementations.
    def create(self, validated_data):
        return Address.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

# Customer Serializer

class CustomerSerializer(serializers.ModelSerializer):
    # Validators (as you had)
    firstname = serializers.CharField(validators=[validate_name, validate_max_length(50)])
    lastname = serializers.CharField(validators=[validate_name, validate_max_length(50)])
    email = serializers.EmailField(
    source="user.email",
    validators=[strip_string, prevent_control_characters, validate_max_length(100)],
    required=False
    )
    phonenumber = serializers.CharField(validators=[validate_phone])

    # View address data (read) using 'source' to map from addressid relation
    address = AddressSerializer(source="addressid", required=False, allow_null=True)

    # Allow switching address by id (write)
    addressid = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Customer
        fields = ["customerid", "address", "addressid", "firstname", "lastname", "email", "phonenumber"]
        read_only_fields = ["customerid"]
    
    @transaction.atomic
    def create(self, validated_data):
        # Pull out the nested user dict (comes from email's source="user.email")
        user_data = validated_data.pop("user", None)
        
        # addressid is an Address instance (resolved by PrimaryKeyRelatedField)
        # It's already in validated_data as the correct key, so just create directly
        customer = Customer.objects.create(**validated_data)
        
        # If an email was provided, create a user and link it to the customer
        if user_data and user_data.get("email"):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            email = user_data["email"]

            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError(
                    {"email": "A client with this email already exists."}
                )
            
            # Create user — no password, they can set one later via invite/reset
            user = User.objects.create_user(email=email, password=None)
            customer.user = user
            customer.save(update_fields=["user"])
        
        return customer
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Supports:
          - Partial updates to Customer fields
          - Nested updates to Address via 'address' (field name) OR via 'addressid' (dict due to source="addressid")
          - Switching Address via 'addressid' PK (Address instance)
          - Updating related User's email if 'email' provided
        """
        # Pull out possible payload forms
        nested_addr_from_field = validated_data.pop("address", None)     # normally nested dict here
        addrid_payload = validated_data.pop("addressid", None)          # can be Address instance OR dict (because source)

        # Normalize what we got
        address_data = None
        new_address_obj = None

        # If 'address' field provided, it wins for nested data
        if nested_addr_from_field is not None:
            address_data = nested_addr_from_field

        # If something came under 'addressid', decide whether it's dict (nested) or Address instance (switch)
        if addrid_payload is not None:
            if isinstance(addrid_payload, dict):
                # DRF placed nested dict under 'addressid' due to source="addressid"
                address_data = addrid_payload
            else:
                # Address instance (user sent PK)
                new_address_obj = addrid_payload

        # Update basic Customer fields (only fields that truly belong to Customer)
        for attr in ("firstname", "lastname", "phonenumber"):
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])

        # Update User email if provided (if your email actually lives on User)
        user_data = validated_data.pop("user", None)
        if user_data and instance.user:
            new_email = user_data.get("email")
            if new_email is not None:
                instance.user.email = new_email
                instance.user.save(update_fields=["email"])

        # Handle nested address update/create
        if address_data is not None:
            allowed_addr_fields = {"street", "city", "province", "postalcode", "country"}
            filtered = {k: v for k, v in address_data.items() if k in allowed_addr_fields}

            if instance.addressid:
                # Update existing related address
                addr = instance.addressid
                for k, v in filtered.items():
                    setattr(addr, k, v)
                addr.save()
            else:
                # Create new address and link it
                addr = Address.objects.create(**filtered)
                instance.addressid = addr

        # If explicit Address instance provided, switch to it (can also unlink if None)
        if new_address_obj is not None or (addrid_payload is None and nested_addr_from_field is None):
            # Note: only assign here if an Address instance was actually provided.
            if new_address_obj is not None:
                instance.addressid = new_address_obj

        instance.save()
        return instance
    

    
# Service Type
class ServiceTypeSerializer(serializers.ModelSerializer):

    # Validator
    typecode = serializers.CharField(validators=[strip_string, prevent_control_characters, validate_max_length(20)])
    typename = serializers.CharField(validators=[strip_string, prevent_control_characters, validate_max_length(100)])

    class Meta:
        model = Servicetype
        fields = ["servicetypeid", "typecode", "typename"]
        read_only_fields = ["servicetypeid"]
        
# Service
class ServiceSerializer(serializers.ModelSerializer):
    # Validator
    title = serializers.CharField(validators=[strip_string, prevent_control_characters, validate_max_length(100)])
    description = serializers.CharField(validators=[strip_string, prevent_control_characters, validate_max_length(500)])
    baseprice = serializers.DecimalField(max_digits=10, decimal_places=2, validators=[validate_amount])

    servicetypeid = serializers.PrimaryKeyRelatedField(
        queryset = Servicetype.objects.all(),
        write_only = True
    )

    servicetype = ServiceTypeSerializer(source="servicetypeid", read_only = True) 

    class Meta:
        model = Service
        fields = ["serviceid", "servicetypeid","servicetype", "title", "description", "baseprice"]
        read_only_fields = ["serviceid"]

# Service Image 
class ServiceImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ServiceImage
        fields = ["id", "service", "bucket", "storage_path", "content_type", "filename", "size_bytes", "created_at", "uploaded_by", "url"]
        read_only_fields = ["id", "created_at", "url"]

    def get_url(self, obj: ServiceImage):
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_uri(f"/core/service-images/{obj.id}/bytes/")

# Customer Service
class CustomerServiceSerializer(serializers.ModelSerializer):

    # Validators
    reqdate = serializers.DateField(validators=[validate_not_past_date])
    redyear = serializers.IntegerField(validators=[validate_not_past_year])

    # View customer data
    customer = CustomerSerializer(source="customerid", read_only=True)

    # View Service
    service = ServiceSerializer(source="serviceid", read_only=True)

    # Have a customer - make it optional since we set it in perform_create
    customerid = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        write_only=True,
        required=False
    )

    # Have a service
    serviceid = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        write_only=True,
        required=True
    )

    class Meta:
        model = Customerservice
        fields = ["customerserviceid", "customerid", "serviceid", "customer", "service", "createdat", "reqdate", "redyear", "completed"]
        read_only_fields = ["createdat", "customer", "service", "customerserviceid"]

# Service Image 
class UserImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = UserImage
        fields = ["id", "user", "bucket", "storage_path", "content_type", "filename", "size_bytes", "created_at", "url"]
        read_only_fields = ["id", "created_at", "url"]

    def get_url(self, obj: UserImage):
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_uri(f"/core/profiles/{obj.id}/bytes/")

# Employee Serializer
class EmployeeSerializer(serializers.ModelSerializer):
    # Validators
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    firstname = serializers.CharField(validators=[validate_name, validate_max_length(50)])
    lastname = serializers.CharField(validators=[validate_name, validate_max_length(50)])
    phonenumber = serializers.CharField(validators=[validate_phone])
    email = serializers.EmailField(
    source="user.email",
    validators=[strip_string, prevent_control_characters, validate_max_length(200)],
    required=False
    )
    address = AddressSerializer(source="addressid", read_only = True)

    addressid = serializers.PrimaryKeyRelatedField(
        queryset = Address.objects.all(),
        write_only = True,
        allow_null = True,
        required = False
    )

    class Meta:
        model = Employee
        fields = ["employeeid", "user_id", "address", "addressid", "firstname", "lastname", "phonenumber", "email", "staffstatus"]
        read_only_fields = ["employeeid"]

# Booking Serializer
class BookingSerializer(serializers.ModelSerializer):
    # Validators
    appointmenttime = serializers.DateTimeField()
    
    customer = CustomerSerializer(source="customerid", read_only=True)
    service = ServiceSerializer(source="serviceid", read_only=True)

    customerid = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        write_only=True
    )

    serviceid = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        write_only=True
    )

    class Meta:
        model = Booking
        fields = [
            "bookingid", "customerid", "serviceid", 
            "customer", "service", 
            "appointmenttime", "status",
            "email", "phonenum"
        ]
        read_only_fields = ["bookingid", "customer", "service"]

    def validate(self, data):
        # Check for double booking
        appointment_time = data.get('appointmenttime')
        service = data.get('serviceid')
        
        if appointment_time and service:
            # Check if this time slot is already booked (pending or confirmed)
            if Booking.objects.filter(
                appointmenttime=appointment_time,
                serviceid=service,
                status__in=['pending', 'confirmed']
            ).exists():
                raise serializers.ValidationError({
                    "appointmenttime": "This time slot is already booked. Please select another time."
                })
        
        return data

    def validate_email(self, value):
        """Validate email format"""
        if value and len(value) > 30:
            raise serializers.ValidationError("Email must not exceed 30 characters")
        return value

    def validate_phonenum(self, value):
        """Validate phone number"""
        if value:
            # Remove any non-digit characters for validation
            clean_phone = ''.join(filter(str.isdigit, value))
            if len(clean_phone) < 10 or len(clean_phone) > 11:
                raise serializers.ValidationError(
                    "Phone number must have 10 or 11 digits"
                )
        return value

    def validate_appointmenttime(self, value):
        """Validate appointment time is in the future"""
        from django.utils import timezone
        
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Appointment time must be in the future"
            )
        return value
    
# Invoice Serializer
class InvoiceSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(source="customerid", read_only = True)
    customerid = serializers.PrimaryKeyRelatedField(
        queryset = Customer.objects.all(),
        write_only = True
    )

    class Meta:
        model = Invoice
        fields = ["invoiceid", "customerid", "customer", "amount", "invoicedate", "status"]
        read_only_fields = ["invoiceid", "customer", "service"]

#Quote Serializer
class QuoteSerializer(serializers.ModelSerializer):
    # Validators
    quotedate = serializers.DateField(validators=[validate_not_past])
    

    customer = CustomerSerializer(source="customerid", read_only = True)
    service = ServiceSerializer(source="serviceid", read_only = True)

    customerid = serializers.PrimaryKeyRelatedField(
        queryset = Customer.objects.all(),
        write_only = True
    )

    serviceid = serializers.PrimaryKeyRelatedField(
        queryset = Service.objects.all(),
        write_only = True
    )

    class Meta:
        model = Quotes
        fields = ["quoteid", "customerid", "serviceid", "customer", "service", "amount", "quotedate", "status"]
        read_only_fields = ["quoteid", "customer", "service"]

# Schedule Serializer
class ScheduleSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(source="bookingid", read_only = True)
    customerservice = CustomerServiceSerializer(source="customerserviceid", read_only = True)
    employee = EmployeeSerializer(source="employeeid", read_only = True)


    bookingid = serializers.PrimaryKeyRelatedField(
        queryset = Booking.objects.all(),
        write_only = True
    )

    customerserviceid = serializers.PrimaryKeyRelatedField(
        queryset = Customerservice.objects.all(),
        write_only = True
    )

    employeeid = serializers.PrimaryKeyRelatedField(
        queryset = Employee.objects.all(),
        write_only = True
    )

    class Meta:
        model = Schedule
        fields = ["scheduleid", "bookingid", "customerserviceid", "employeeid", "booking", "customerservice", "employee", "starttime", "endtime", "status"]
        read_only_fields = ["scheduleid"]

# Site Serializer
class SiteSerializer(serializers.ModelSerializer):
    address = AddressSerializer(source="addressid", read_only = True)

    addressid = serializers.PrimaryKeyRelatedField(
        queryset = Address.objects.all(),
        write_only = True
    )

    class Meta:
        model = Site
        fields = ["siteid", "addressid", "address"]
        read_only_fields = ["siteid"]

#Zone Serializer
class ZoneSerializer(serializers.ModelSerializer):
    site = SiteSerializer(source="siteid", read_only = True)

    siteid = serializers.PrimaryKeyRelatedField(
        queryset = Site.objects.all(),
        write_only = True
    )

    class Meta:
        model = Zone
        fields = ["zoneid", "siteid", "site", "zonecode", "description"]
        read_only_fields = ["zoneid"]

#Request Quote Serializer
class RequestQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestQuote
        fields = '__all__'
        read_only_fields = ['requestquoteid']

#Service Location Serializer
class ServiceLocationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customerid.__str__', read_only=True)
    
    # Get services linked to this location through LocationService
    services = serializers.SerializerMethodField()

    class Meta:
        model = ServiceLocation
        fields = [
            "servicelocationid",
            "street",
            "city",
            "province",
            "postalcode",
            "customerid",
            "customer_name",
            "services"  
        ]
        read_only_fields = ["servicelocationid", "customer_name", "services"]

    def get_services(self, obj):
        """Get all services linked to this specific location through LocationService"""
        from .models import LocationService
        
        # Get location services linked to this location
        location_services = LocationService.objects.filter(
            servicelocationid=obj
        ).select_related(
            'customerserviceid__serviceid',
            'customerserviceid__customerid'
        ).order_by('-created_at')
        
        # Format the services data
        services_data = []
        for ls in location_services:
            cs = ls.customerserviceid
            if cs.serviceid:
                services_data.append({
                    'id': cs.customerserviceid,
                    'service_id': cs.serviceid.serviceid,
                    'title': cs.serviceid.title,
                    'description': cs.serviceid.description,
                    'base_price': str(cs.serviceid.baseprice),
                    'req_date': cs.reqdate,
                    'completed': cs.completed,
                    'created_at': cs.createdat,
                    'red_year': cs.redyear,
                    'linked_at': ls.created_at,
                })
        
        return services_data

#Location Service
class LocationServiceSerializer(serializers.ModelSerializer):
    service_details = CustomerServiceSerializer(source='customerserviceid', read_only=True)
    
    class Meta:
        model = LocationService
        fields = ['locationserviceid', 'servicelocationid', 'customerserviceid', 'service_details', 'created_at']
        read_only_fields = ['locationserviceid', 'created_at', 'service_details']

#Budget & Expense
class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'amount', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'name', 'amount', 'category', 'date']

