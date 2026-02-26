from rest_framework import serializers
from core.management.validators import (
    validate_name,
    validate_postal_code,
    validate_province,
    validate_phone,
    validate_amount,
    validate_not_past,
    strip_string,
    prevent_control_characters,
    validate_max_length
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
);


# Address
class AddressSerializer(serializers.ModelSerializer):
    # Custom validators for address fields
    street = serializers.CharField(validators=[strip_string, prevent_control_characters, validate_max_length(120)])
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

# Customer
class CustomerSerializer(serializers.ModelSerializer):

    # Validator
    firstname = serializers.CharField(validators=[validate_name, validate_max_length(50)])
    lastname = serializers.CharField(validators=[validate_name, validate_max_length(50)])
    email = serializers.EmailField(validators=[strip_string, prevent_control_characters, validate_max_length(200)])
    phonenumber = serializers.CharField(validators=[validate_phone])

    #View address data
    address = AddressSerializer(source="addressid", required = False)
    # Add an address to the customer
    addressid = serializers.PrimaryKeyRelatedField(
        queryset = Address.objects.all(),
        write_only=True,
        required = False,
        allow_null = True
    )

    class Meta:
        model = Customer
        fields = ["customerid", "address", "addressid", "firstname", "lastname", "email", "phonenumber"]
        read_only_fields = ["customerid"]

    #own update method so user can update nested serializer fields.
    def update(self, instance, validated_data):
        # handles nested address update
        address_data = validated_data.pop("address", None)

        # handles switching address by id if provided.
        new_address_obj = validated_data.pop("addressid", None) if "addressid" in validated_data else None

        # Update fields on customer
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # If address data is manipulated
        if address_data and instance.addressid:
            addr = instance.addressid
            for attr, value in address_data.items():
                setattr(addr, attr, value)
            addr.save()

        # If the address id is provided
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
        fields = ["serviceid", "servicetypeid", "title", "description", "baseprice"]
        read_only_fields = ["serviceid"]

# Service Image 
class ServiceImageSerializer(serializers.ModelSerializer):
    # Define URL
    url = serializers.SerializerMethodField()

    class Meta:
        model = ServiceImage
        fields = ["id", "service", "filename", "content_type", "size_bytes", "created_at", "url"]
        read_only_fields = ["id", "created_at", "url"]

    # Method to get the image url from db, write only = True for imagedata field, so it won't be returned in the response, only used for creating new service images.
    def get_url(self, obj: ServiceImage):
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_url(
            f"/core/services/{obj.service_id}/images/{obj.id}/bytes"
        )

# Customer Service
class CustomerServiceSerializer(serializers.ModelSerializer):

    # Validators
    reqdate = serializers.DateField(validators=[validate_not_past])
    redyear = serializers.IntegerField(validators=[validate_not_past])


    # View customer data
    customer = CustomerSerializer(source = "customerid", read_only = True)

    # View Service
    service = ServiceSerializer(source = "serviceid", read_only = True)

    # Have a customer
    customerid = serializers.PrimaryKeyRelatedField(
        queryset = Customer.objects.all(),  
        write_only = True
    )

    # Have a service
    serviceid = serializers.PrimaryKeyRelatedField(
        queryset = Service.objects.all(),
        write_only = True
    )

    class Meta:
        model = Customerservice
        fields = ["customerid", "serviceid", "customer", "service", "createdat", "reqdate", "redyear", "completed"]
        read_only_fields = ["createdat", "customer", "service"]

# Employee Serializer
class EmployeeSerializer(serializers.ModelSerializer):
    # Validators
    firstname = serializers.CharField(validators=[validate_name, validate_max_length(50)])
    lastname = serializers.CharField(validators=[validate_name, validate_max_length(50)])
    employeenumber = serializers.CharField(validators=[strip_string, prevent_control_characters, validate_max_length(10)])
    phonenumber = serializers.CharField(validators=[validate_phone])


    address = AddressSerializer(source="addressid", read_only = True)

    addressid = serializers.PrimaryKeyRelatedField(
        queryset = Address.objects.all(),
        write_only = True,
        allow_null = True,
        required = False
    )

    class Meta:
        model = Employee
        fields = ["employeeid", "address", "addressid", "employeenumber", "firstname", "lastname", "phonenumber", "staffstatus"]
        read_only_fields = ["employeeid"]

# Booking Serializer
class BookingSerializer(serializers.ModelSerializer):
    # Validators
    bookingdate = serializers.DateField(validators=[validate_not_past])
    bookingtime = serializers.TimeField(validators=[validate_not_past])

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
        model = Booking
        fields = ["bookingid", "customerid", "serviceid", "customer", "service", "bookingdate", "bookingtime", "status"]
        read_only_fields = ["bookingid", "customer", "service"]

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
